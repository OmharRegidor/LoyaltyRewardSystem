'use client';

import { useState, useEffect } from 'react';
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

interface AdjustStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  preselectedProductId?: string;
  onSuccess: () => void;
}

export function AdjustStockDialog({
  open,
  onOpenChange,
  products,
  preselectedProductId,
  onSuccess,
}: AdjustStockDialogProps) {
  const [productId, setProductId] = useState(preselectedProductId || '');
  const [newQuantity, setNewQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const selectedProduct = products.find((p) => p.id === productId);

  useEffect(() => {
    if (preselectedProductId) {
      setProductId(preselectedProductId);
    }
  }, [preselectedProductId]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setProductId(preselectedProductId || '');
      setNewQuantity('');
      setReason('');
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async () => {
    const qty = parseInt(newQuantity, 10);
    if (!productId || isNaN(qty) || !reason.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/dashboard/pos/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          new_quantity: qty,
          reason: reason.trim(),
        }),
      });

      if (response.ok) {
        handleOpenChange(false);
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to adjust stock:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
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

          {selectedProduct && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <span className="text-muted-foreground">Current Stock: </span>
              <span className="font-medium">{selectedProduct.stock_quantity}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="adjust-quantity">New Quantity *</Label>
            <Input
              id="adjust-quantity"
              type="number"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              placeholder="Enter new stock quantity"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjust-reason">Reason *</Label>
            <Input
              id="adjust-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Physical count correction, damaged goods"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving || !productId || newQuantity === '' || !reason.trim()}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Adjust Stock'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
