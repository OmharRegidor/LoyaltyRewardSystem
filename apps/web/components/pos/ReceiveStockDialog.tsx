'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Product } from '@/types/pos.types';

interface ReceiveStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  preselectedProductId?: string;
  onSuccess: () => void;
}

export function ReceiveStockDialog({
  open,
  onOpenChange,
  products,
  preselectedProductId,
  onSuccess,
}: ReceiveStockDialogProps) {
  const [productId, setProductId] = useState(preselectedProductId || '');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setProductId(preselectedProductId || '');
      setQuantity('');
      setNotes('');
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async () => {
    const qty = parseInt(quantity, 10);
    if (!productId || !qty || qty <= 0) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/dashboard/pos/inventory/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          quantity: qty,
          notes: notes || undefined,
        }),
      });

      if (response.ok) {
        handleOpenChange(false);
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to receive stock:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Receive Stock</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Product *</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receive-quantity">Quantity *</Label>
            <Input
              id="receive-quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity received"
              min="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receive-notes">Notes</Label>
            <Input
              id="receive-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Supplier delivery, PO #123"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving || !productId || !quantity || parseInt(quantity, 10) <= 0}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Receive Stock'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
