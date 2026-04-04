'use client';

interface StockLevelBadgeProps {
  stockQuantity: number;
  lowStockThreshold: number;
}

export function StockLevelBadge({ stockQuantity, lowStockThreshold }: StockLevelBadgeProps) {
  if (stockQuantity <= 0) {
    return (
      <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-red-50 px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-medium text-red-700 ring-1 ring-red-600/10 whitespace-nowrap">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
        Out of Stock
      </span>
    );
  }

  if (stockQuantity <= lowStockThreshold) {
    return (
      <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-amber-50 px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-medium text-amber-700 ring-1 ring-amber-600/10 whitespace-nowrap">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
        Low Stock ({stockQuantity})
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-emerald-50 px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/10 whitespace-nowrap">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
      In Stock ({stockQuantity})
    </span>
  );
}
