'use client';

import { useMemo } from 'react';
import { Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Product } from '@/types/pos.types';

interface ProductGridProps {
  products: Product[];
  onProductSelect: (product: Product) => void;
  disabled?: boolean;
}

function formatPrice(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

function ProductCards({
  products,
  onProductSelect,
  disabled,
}: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 p-4">
      {products.map((product) => (
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
  );
}

export function ProductGrid({ products, onProductSelect, disabled }: ProductGridProps) {
  const categories = useMemo(() => {
    const cats: Record<string, Product[]> = {};
    for (const product of products) {
      const cat = product.category || 'Uncategorized';
      if (!cats[cat]) cats[cat] = [];
      cats[cat].push(product);
    }
    return cats;
  }, [products]);

  const categoryNames = Object.keys(categories);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground flex-1">
        <Package className="h-12 w-12 mb-2" />
        <p>No products yet</p>
        <p className="text-sm">Add products in the Products tab</p>
      </div>
    );
  }

  // If only one category, skip tabs
  if (categoryNames.length <= 1) {
    return (
      <ScrollArea className="flex-1 min-h-0">
        <ProductCards
          products={products}
          onProductSelect={onProductSelect}
          disabled={disabled}
        />
      </ScrollArea>
    );
  }

  return (
    <Tabs defaultValue="all" className="flex flex-col flex-1 min-h-0 gap-0">
      <div className="border-b px-4 pt-1 pb-2 shrink-0">
        <TabsList className="w-full h-auto flex-wrap justify-center gap-1">
          <TabsTrigger value="all" className="text-xs">
            All
          </TabsTrigger>
          {categoryNames.map((cat) => (
            <TabsTrigger key={cat} value={cat} className="text-xs">
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="all" className="flex-1 overflow-hidden m-0">
        <ScrollArea className="h-full">
          <ProductCards
            products={products}
            onProductSelect={onProductSelect}
            disabled={disabled}
          />
        </ScrollArea>
      </TabsContent>

      {categoryNames.map((cat) => (
        <TabsContent key={cat} value={cat} className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-full">
            <ProductCards
              products={categories[cat]}
              onProductSelect={onProductSelect}
              disabled={disabled}
            />
          </ScrollArea>
        </TabsContent>
      ))}
    </Tabs>
  );
}
