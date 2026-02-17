'use client';

import { Badge } from '@/components/ui/badge';

interface StockLevelBadgeProps {
  stockQuantity: number;
  lowStockThreshold: number;
}

export function StockLevelBadge({ stockQuantity, lowStockThreshold }: StockLevelBadgeProps) {
  if (stockQuantity <= 0) {
    return (
      <Badge variant="destructive">
        Out of Stock
      </Badge>
    );
  }

  if (stockQuantity <= lowStockThreshold) {
    return (
      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
        Low Stock ({stockQuantity})
      </Badge>
    );
  }

  return (
    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
      In Stock ({stockQuantity})
    </Badge>
  );
}
