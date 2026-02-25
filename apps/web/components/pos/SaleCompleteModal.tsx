'use client';

import { CheckCircle, Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { SaleWithItems, PaymentMethod } from '@/types/pos.types';

interface SaleCompleteModalProps {
  sale: SaleWithItems | null;
  isOpen: boolean;
  onClose: () => void;
  onNewSale: () => void;
}

function formatPrice(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Cash',
  gcash: 'GCash',
  maya: 'Maya',
  card: 'Card',
};

export function SaleCompleteModal({ sale, isOpen, onClose, onNewSale }: SaleCompleteModalProps) {
  if (!sale) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <DialogTitle>Sale Complete</DialogTitle>
              <p className="text-sm text-muted-foreground">#{sale.sale_number}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Items */}
          <div className="space-y-2">
            {sale.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.name} x {item.quantity}
                </span>
                <span>{formatPrice(item.total_centavos)}</span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Summary */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(sale.subtotal_centavos)}</span>
            </div>
            {sale.discount_centavos > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-{formatPrice(sale.discount_centavos)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatPrice(sale.total_centavos)}</span>
            </div>
          </div>

          <Separator />

          {/* Payment */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Method</span>
              <span>{paymentMethodLabels[sale.payment_method]}</span>
            </div>
            {sale.payment_method === 'cash' && sale.amount_tendered_centavos && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount Tendered</span>
                  <span>{formatPrice(sale.amount_tendered_centavos)}</span>
                </div>
                {sale.change_centavos !== null && sale.change_centavos > 0 && (
                  <div className="flex justify-between text-sm font-medium">
                    <span>Change</span>
                    <span>{formatPrice(sale.change_centavos)}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Points */}
          {sale.customer && sale.points_earned > 0 && (
            <>
              <Separator />
              <div className="flex items-center justify-between bg-primary/10 text-primary p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Points Earned</p>
                    <p className="text-xs opacity-75">{sale.customer.full_name}</p>
                  </div>
                </div>
                <span className="text-xl font-bold">+{sale.points_earned}</span>
              </div>
            </>
          )}
        </div>

        <Button className="w-full" onClick={onNewSale}>
          New Sale
        </Button>
      </DialogContent>
    </Dialog>
  );
}
