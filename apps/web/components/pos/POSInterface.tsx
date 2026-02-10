'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CustomerSearch } from './CustomerSearch';
import { CustomerCard } from './CustomerCard';
import { ProductGrid } from './ProductGrid';
import { QuickAmountInput } from './QuickAmountInput';
import { SaleItemList } from './SaleItemList';
import { SaleSummary } from './SaleSummary';
import { DiscountInput } from './DiscountInput';
import { CashPaymentInput } from './CashPaymentInput';
import { SaleCompleteModal } from './SaleCompleteModal';
import type {
  Product,
  CartItem,
  LinkedCustomer,
  SaleWithItems,
  DiscountType,
} from '@/types/pos.types';

interface POSInterfaceProps {
  businessSettings?: {
    pesos_per_point: number | null;
    min_purchase_for_points: number | null;
    max_points_per_transaction: number | null;
  };
  onSaleComplete?: () => void;
}

function generateId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function POSInterface({ businessSettings, onSaleComplete }: POSInterfaceProps) {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [items, setItems] = useState<CartItem[]>([]);
  const [linkedCustomer, setLinkedCustomer] = useState<LinkedCustomer | null>(null);
  const [discount, setDiscount] = useState<{
    centavos: number;
    type: DiscountType;
    reason?: string;
  }>({ centavos: 0, type: 'percentage' });
  const [amountTenderedCentavos, setAmountTenderedCentavos] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSale, setCompletedSale] = useState<SaleWithItems | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load products on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('/api/dashboard/pos/products');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load products');
        }

        setProducts(data.products.filter((p: Product) => p.is_active));
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  // Calculate totals
  const subtotalCentavos = useMemo(
    () => items.reduce((sum, item) => sum + item.unit_price_centavos * item.quantity, 0),
    [items]
  );
  const discountCentavos = discount.centavos;
  const totalCentavos = Math.max(0, subtotalCentavos - discountCentavos);

  // Discount handler
  const handleDiscountChange = useCallback(
    (centavos: number, type: DiscountType, reason?: string) => {
      setDiscount({ centavos, type, reason });
    },
    []
  );

  // Calculate points earned
  const pointsEarned = useMemo(() => {
    if (!linkedCustomer || !businessSettings) return 0;

    const totalPesos = totalCentavos / 100;
    const minPurchase = businessSettings.min_purchase_for_points || 0;
    const pesosPerPoint = businessSettings.pesos_per_point || 100;
    const maxPoints = businessSettings.max_points_per_transaction;

    if (totalPesos < minPurchase) return 0;

    const points = Math.floor(totalPesos / pesosPerPoint);

    if (maxPoints !== null && maxPoints !== undefined) {
      return Math.min(points, maxPoints);
    }

    return points;
  }, [totalCentavos, linkedCustomer, businessSettings]);

  // Handlers
  const handleProductSelect = useCallback((product: Product) => {
    setItems((prev) => {
      // Check if product already in cart
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: generateId(),
          product_id: product.id,
          name: product.name,
          description: product.description || undefined,
          quantity: 1,
          unit_price_centavos: product.price_centavos,
        },
      ];
    });
  }, []);

  const handleQuickAdd = useCallback((name: string, priceCentavos: number) => {
    setItems((prev) => [
      ...prev,
      {
        id: generateId(),
        name,
        quantity: 1,
        unit_price_centavos: priceCentavos,
      },
    ]);
  }, []);

  const handleUpdateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) return;
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    );
  }, []);

  const handleRemoveItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const handleCompleteSale = useCallback(async () => {
    if (items.length === 0) return;

    // Validate cash payment
    if (amountTenderedCentavos < totalCentavos) {
      setError('Amount tendered is less than total');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/dashboard/pos/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            product_id: item.product_id,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unit_price_centavos: item.unit_price_centavos,
          })),
          customer_id: linkedCustomer?.id,
          discount_centavos: discountCentavos > 0 ? discountCentavos : undefined,
          discount_type: discountCentavos > 0 ? discount.type : undefined,
          discount_reason: discountCentavos > 0 ? discount.reason : undefined,
          payment_method: 'cash',
          amount_tendered_centavos: amountTenderedCentavos,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete sale');
      }

      setCompletedSale(data.sale);
      // Notify parent to refresh summary
      onSaleComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete sale');
    } finally {
      setIsProcessing(false);
    }
  }, [items, linkedCustomer, amountTenderedCentavos, totalCentavos, discountCentavos, discount.type, discount.reason, onSaleComplete]);

  const handleNewSale = useCallback(() => {
    setItems([]);
    setLinkedCustomer(null);
    setDiscount({ centavos: 0, type: 'percentage' });
    setAmountTenderedCentavos(0);
    setCompletedSale(null);
    setError(null);
  }, []);

  const canCompleteSale = items.length > 0 && amountTenderedCentavos >= totalCentavos;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(100vh-8rem)]">
      {/* Left Panel - Products & Quick Entry */}
      <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden">
        {/* Customer Search */}
        <Card>
          <CardContent className="pt-4">
            {linkedCustomer ? (
              <CustomerCard
                customer={linkedCustomer}
                onRemove={() => setLinkedCustomer(null)}
              />
            ) : (
              <CustomerSearch
                onCustomerFound={setLinkedCustomer}
                disabled={isProcessing}
              />
            )}
          </CardContent>
        </Card>

        {/* Quick Amount Input */}
        <Card>
          <CardContent className="pt-4">
            <QuickAmountInput onAdd={handleQuickAdd} disabled={isProcessing} />
          </CardContent>
        </Card>

        {/* Products */}
        <Card className="flex-1 overflow-hidden">
          <CardHeader className="py-3">
            <CardTitle className="text-base">Products</CardTitle>
          </CardHeader>
          <ScrollArea className="h-[calc(100%-3rem)]">
            <CardContent>
              {isLoadingProducts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ProductGrid
                  products={products}
                  onProductSelect={handleProductSelect}
                  disabled={isProcessing}
                />
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      </div>

      {/* Right Panel - Cart & Payment */}
      <div className="lg:col-span-2 flex flex-col gap-4 overflow-hidden">
        {/* Current Sale */}
        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardHeader className="py-3 border-b">
            <CardTitle className="text-base">Current Sale</CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1">
            <CardContent className="py-4">
              <SaleItemList
                items={items}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                disabled={isProcessing}
              />
            </CardContent>
          </ScrollArea>

          {items.length > 0 && (
            <div className="border-t p-4 space-y-4">
              <DiscountInput
                subtotalCentavos={subtotalCentavos}
                onDiscountChange={handleDiscountChange}
                disabled={isProcessing}
              />
              <SaleSummary
                items={items}
                discountCentavos={discountCentavos}
                pointsEarned={pointsEarned}
                hasCustomer={linkedCustomer !== null}
              />
            </div>
          )}
        </Card>

        {/* Payment (Cash Only) */}
        {items.length > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CashPaymentInput
                totalCentavos={totalCentavos}
                onTenderedChange={setAmountTenderedCentavos}
                disabled={isProcessing}
              />

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handleCompleteSale}
                disabled={!canCompleteSale || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Complete Sale'
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sale Complete Modal */}
      <SaleCompleteModal
        sale={completedSale}
        isOpen={completedSale !== null}
        onClose={() => setCompletedSale(null)}
        onNewSale={handleNewSale}
      />
    </div>
  );
}
