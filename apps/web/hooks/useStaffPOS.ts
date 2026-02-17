// apps/web/hooks/useStaffPOS.ts

import { useState, useCallback, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import type { Product } from "@/types/pos.types";
import type {
  StaffCartItem,
  DiscountInfo,
  ExchangeInfo,
  StaffSaleResult,
  TierKey,
} from "@/types/staff-pos.types";
import { TIERS } from "@/types/staff-pos.types";

interface UseStaffPOSOptions {
  pesosPerPoint: number;
  customerPoints: number;
  customerTier: TierKey;
  customerId: string;
}

interface UseStaffPOSReturn {
  // Product state
  products: Product[];
  isLoadingProducts: boolean;
  hasPOSModule: boolean;

  // Cart state
  cartItems: StaffCartItem[];
  discount: DiscountInfo | null;
  exchange: ExchangeInfo | null;

  // Computed values
  subtotalCentavos: number;
  discountCentavos: number;
  afterDiscountCentavos: number;
  exchangeCentavos: number;
  totalDueCentavos: number;
  basePointsToEarn: number;
  pointsToEarn: number;
  tierMultiplier: number;
  maxExchangePoints: number;

  // Processing state
  isProcessing: boolean;
  saleResult: StaffSaleResult | null;

  // Actions
  addProduct: (product: Product) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  addManualItem: (name: string, pricePesos: number) => void;
  setDiscount: (discount: DiscountInfo | null) => void;
  setExchange: (points: number) => void;
  completeSale: () => Promise<StaffSaleResult>;
  reset: () => void;
}

export function useStaffPOS(options: UseStaffPOSOptions): UseStaffPOSReturn {
  const { pesosPerPoint, customerPoints, customerTier, customerId } = options;

  // Product state
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [hasPOSModule, setHasPOSModule] = useState(true);

  // Cart state
  const [cartItems, setCartItems] = useState<StaffCartItem[]>([]);
  const [discount, setDiscount] = useState<DiscountInfo | null>(null);
  const [exchange, setExchange] = useState<ExchangeInfo | null>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [saleResult, setSaleResult] = useState<StaffSaleResult | null>(null);

  // Load products on init
  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const res = await fetch("/api/dashboard/pos/products");
        if (res.status === 403) {
          // No POS module — manual-only mode
          setHasPOSModule(false);
          setProducts([]);
          return;
        }
        if (!res.ok) {
          setProducts([]);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setProducts(
            (data.products || []).filter((p: Product) => p.is_active),
          );
        }
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setIsLoadingProducts(false);
      }
    }

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const subtotalCentavos = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + item.unit_price_centavos * item.quantity,
        0,
      ),
    [cartItems],
  );

  const discountCentavos = useMemo(() => {
    if (!discount) return 0;
    if (discount.type === "percentage") {
      return Math.round((subtotalCentavos * discount.value) / 100);
    }
    return Math.min(discount.value, subtotalCentavos);
  }, [discount, subtotalCentavos]);

  const afterDiscountCentavos = useMemo(
    () => Math.max(0, subtotalCentavos - discountCentavos),
    [subtotalCentavos, discountCentavos],
  );

  const maxExchangePoints = useMemo(() => {
    const maxByBalance = customerPoints;
    const maxByAmount = Math.floor(afterDiscountCentavos / 100 / pesosPerPoint);
    return Math.min(maxByBalance, maxByAmount);
  }, [customerPoints, afterDiscountCentavos, pesosPerPoint]);

  const exchangeCentavos = useMemo(
    () => (exchange ? exchange.pesosValueCentavos : 0),
    [exchange],
  );

  const totalDueCentavos = useMemo(
    () => Math.max(0, afterDiscountCentavos - exchangeCentavos),
    [afterDiscountCentavos, exchangeCentavos],
  );

  const tierMultiplier = TIERS[customerTier]?.multiplier || 1;

  const basePointsToEarn = useMemo(() => {
    const totalPesos = totalDueCentavos / 100;
    return Math.floor(totalPesos / pesosPerPoint);
  }, [totalDueCentavos, pesosPerPoint]);

  const pointsToEarn = useMemo(
    () => Math.floor(basePointsToEarn * tierMultiplier),
    [basePointsToEarn, tierMultiplier],
  );

  // ============================================
  // ACTIONS
  // ============================================

  const addProduct = useCallback((product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          id: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          product_id: product.id,
          name: product.name,
          description: product.description || undefined,
          quantity: 1,
          unit_price_centavos: product.price_centavos,
          image_url: product.image_url,
          stock_quantity: product.stock_quantity,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.id !== itemId));
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity } : item)),
    );
  }, []);

  const addManualItem = useCallback((name: string, pricePesos: number) => {
    const priceCentavos = Math.round(pricePesos * 100);
    if (priceCentavos <= 0 || !name.trim()) return;

    setCartItems((prev) => [
      ...prev,
      {
        id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: name.trim(),
        quantity: 1,
        unit_price_centavos: priceCentavos,
      },
    ]);
  }, []);

  const handleSetExchange = useCallback(
    (points: number) => {
      if (points <= 0) {
        setExchange(null);
        return;
      }
      const capped = Math.min(points, maxExchangePoints);
      setExchange({
        pointsUsed: capped,
        pesosValueCentavos: capped * pesosPerPoint * 100,
      });
    },
    [maxExchangePoints, pesosPerPoint],
  );

  const completeSale = useCallback(async (): Promise<StaffSaleResult> => {
    setIsProcessing(true);
    try {
      const payload = {
        customer_id: customerId,
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unit_price_centavos: item.unit_price_centavos,
        })),
        discount_type: discount?.type,
        discount_centavos: discountCentavos > 0 ? discountCentavos : undefined,
        discount_reason: discount?.reason,
        exchange_points: exchange?.pointsUsed,
        tier: customerTier,
      };

      const { data: { session } } = await createClient().auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch("/api/staff/pos/sale", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to complete sale");
      }

      const { data } = await res.json();
      setSaleResult(data);
      return data;
    } finally {
      setIsProcessing(false);
    }
  }, [
    customerId,
    cartItems,
    discount,
    discountCentavos,
    exchange,
    customerTier,
  ]);

  const reset = useCallback(() => {
    setCartItems([]);
    setDiscount(null);
    setExchange(null);
    setSaleResult(null);
    setIsProcessing(false);
  }, []);

  return {
    products,
    isLoadingProducts,
    hasPOSModule,
    cartItems,
    discount,
    exchange,
    subtotalCentavos,
    discountCentavos,
    afterDiscountCentavos,
    exchangeCentavos,
    totalDueCentavos,
    basePointsToEarn,
    pointsToEarn,
    tierMultiplier,
    maxExchangePoints,
    isProcessing,
    saleResult,
    addProduct,
    removeItem,
    updateQuantity,
    addManualItem,
    setDiscount,
    setExchange: handleSetExchange,
    completeSale,
    reset,
  };
}
