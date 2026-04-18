// apps/web/hooks/useStaffPOS.ts

import { useState, useCallback, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import type { Product } from "@/types/pos.types";
import type { Service } from "@/types/service.types";
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
  businessId?: string;
  businessType?: string | null;
  minPurchaseForPoints: number;
  maxPointsPerTransaction: number | null;
  skipPoints?: boolean;
}

interface UseStaffPOSReturn {
  // Product & service state
  products: Product[];
  services: Service[];
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

  // Cash tendered
  amountTenderedCentavos: number;
  setAmountTenderedCentavos: (amount: number) => void;

  // Processing state
  isProcessing: boolean;
  saleResult: StaffSaleResult | null;

  // Actions
  addProduct: (product: Product) => void;
  addService: (service: Service) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  addManualItem: (name: string, pricePesos: number) => void;
  setDiscount: (discount: DiscountInfo | null) => void;
  setExchange: (points: number) => void;
  completeSale: () => Promise<StaffSaleResult>;
  reset: () => void;
}

export function useStaffPOS(options: UseStaffPOSOptions): UseStaffPOSReturn {
  const { pesosPerPoint, customerPoints, customerTier, customerId, businessId, businessType, minPurchaseForPoints, maxPointsPerTransaction, skipPoints } = options;

  // Product & service state
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [hasPOSModule, setHasPOSModule] = useState(true);

  // Cart state
  const [cartItems, setCartItems] = useState<StaffCartItem[]>([]);
  const [discount, setDiscount] = useState<DiscountInfo | null>(null);
  const [exchange, setExchange] = useState<ExchangeInfo | null>(null);

  // Cash tendered state
  const [amountTenderedCentavos, setAmountTenderedCentavos] = useState(0);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [saleResult, setSaleResult] = useState<StaffSaleResult | null>(null);

  // Load products and services on init
  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      try {
        // Fetch pos_mode to determine what to load
        const modeRes = await fetch("/api/dashboard/pos/business-type");
        const modeData = modeRes.ok ? await modeRes.json() : null;
        const posMode = modeData?.pos_mode || 'both';
        const loadProducts = posMode === 'products' || posMode === 'both';
        const loadServices = posMode === 'services' || posMode === 'both';

        // Fetch products and services based on pos_mode
        const [productsRes, servicesRes] = await Promise.all([
          loadProducts ? fetch("/api/dashboard/pos/products") : Promise.resolve(null),
          loadServices ? fetch("/api/dashboard/pos/services") : Promise.resolve(null),
        ]);

        if (productsRes && productsRes.status === 403) {
          setHasPOSModule(false);
          setProducts([]);
          setServices([]);
          return;
        }

        if (!cancelled) {
          if (productsRes && productsRes.ok) {
            const data = await productsRes.json();
            setProducts(
              (data.products || []).filter((p: Product) => p.is_active),
            );
          } else {
            setProducts([]);
          }

          if (servicesRes && servicesRes.ok) {
            const data = await servicesRes.json();
            setServices(
              (data.services || []).filter((s: Service) => s.is_active),
            );
          } else {
            setServices([]);
          }
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setServices([]);
        }
      } finally {
        if (!cancelled) setIsLoadingProducts(false);
      }
    }

    loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  // Realtime stock updates from other staff
  useEffect(() => {
    if (!businessId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`products-stock-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          const updated = payload.new as { id: string; stock_quantity: number };
          setProducts((prev) =>
            prev.map((p) =>
              p.id === updated.id ? { ...p, stock_quantity: updated.stock_quantity } : p,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId]);

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

  const tierMultiplier = skipPoints ? 0 : (TIERS[customerTier]?.multiplier || 1);

  const basePointsToEarn = useMemo(() => {
    const totalPesos = totalDueCentavos / 100;
    if (totalPesos < minPurchaseForPoints) return 0;
    const points = Math.floor(totalPesos / pesosPerPoint);
    if (maxPointsPerTransaction !== null && maxPointsPerTransaction !== undefined) {
      return Math.min(points, maxPointsPerTransaction);
    }
    return points;
  }, [totalDueCentavos, pesosPerPoint, minPurchaseForPoints, maxPointsPerTransaction]);

  const pointsToEarn = useMemo(
    () => Math.floor(basePointsToEarn * tierMultiplier),
    [basePointsToEarn, tierMultiplier],
  );

  // ============================================
  // ACTIONS
  // ============================================

  const addProduct = useCallback((product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product_id === product.id && item.item_type !== 'service');
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id && item.item_type !== 'service'
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
          item_type: 'product' as const,
        },
      ];
    });
  }, []);

  const addService = useCallback((service: Service) => {
    setCartItems((prev) => {
      const serviceCartId = `svc-${service.id}`;
      const existing = prev.find((item) => item.id === serviceCartId);
      if (existing) {
        return prev.map((item) =>
          item.id === serviceCartId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          id: serviceCartId,
          name: service.name,
          description: service.description || undefined,
          quantity: 1,
          unit_price_centavos: service.price_centavos,
          image_url: service.image_url,
          item_type: 'service' as const,
          duration_minutes: service.duration_minutes,
          duration_unit: service.duration_unit || 'minutes',
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
    // Defense in depth: UI validates as well, but guard against overflow/garbage here.
    const MAX_PRICE_PESOS = 1_000_000;
    if (
      !Number.isFinite(pricePesos) ||
      pricePesos <= 0 ||
      pricePesos > MAX_PRICE_PESOS ||
      !name.trim()
    ) {
      return;
    }
    const priceCentavos = Math.round(pricePesos * 100);

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
        ...(amountTenderedCentavos > 0 && { amount_tendered_centavos: amountTenderedCentavos }),
        tier: customerTier,
        ...(skipPoints && { skip_points: true }),
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
    amountTenderedCentavos,
    skipPoints,
  ]);

  const reset = useCallback(() => {
    setCartItems([]);
    setDiscount(null);
    setExchange(null);
    setAmountTenderedCentavos(0);
    setSaleResult(null);
    setIsProcessing(false);
  }, []);

  return {
    products,
    services,
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
    amountTenderedCentavos,
    setAmountTenderedCentavos,
    isProcessing,
    saleResult,
    addProduct,
    addService,
    removeItem,
    updateQuantity,
    addManualItem,
    setDiscount,
    setExchange: handleSetExchange,
    completeSale,
    reset,
  };
}
