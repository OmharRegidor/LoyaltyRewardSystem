'use client';

import { Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { Product } from '@/types/pos.types';

interface ProductGridProps {
  products: Product[];
  onProductSelect: (product: Product) => void;
  disabled?: boolean;
}

function formatPrice(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

export function ProductGrid({ products, onProductSelect, disabled }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Package className="h-12 w-12 mb-2" />
        <p>No products yet</p>
        <p className="text-sm">Add products in the Products tab</p>
      </div>
    );
  }

  // Group products by category
  const categories = products.reduce((acc, product) => {
    const category = product.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="space-y-4">
      {Object.entries(categories).map(([category, categoryProducts]) => (
        <div key={category}>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">{category}</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {categoryProducts.map((product) => (
              <Card
                key={product.id}
                className={`cursor-pointer overflow-hidden transition-all hover:ring-2 hover:ring-primary hover:shadow-md ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={() => !disabled && onProductSelect(product)}
              >
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-24 object-cover"
                  />
                ) : (
                  <div className="w-full h-24 bg-muted flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="p-2 text-center">
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <p className="text-primary font-bold text-sm">
                    {formatPrice(product.price_centavos)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
