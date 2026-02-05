// apps/web/components/booking/fields/AddonSelector.tsx
'use client';

import { Package, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface Addon {
  id: string;
  name: string;
  description: string | null;
  price_centavos: number;
  price_type: 'fixed' | 'per_day' | 'per_person';
  service_id: string | null;
}

interface SelectedAddon {
  id: string;
  name: string;
  priceCentavos: number;
  priceType: 'fixed' | 'per_day' | 'per_person';
  quantity: number;
}

interface AddonSelectorProps {
  addons: Addon[];
  selectedAddons: SelectedAddon[];
  onToggle: (addon: Addon) => void;
  onQuantityChange: (addonId: string, quantity: number) => void;
  className?: string;
}

function formatPrice(centavos: number): string {
  const pesos = centavos / 100;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pesos);
}

function getPriceLabel(priceType: string): string {
  switch (priceType) {
    case 'per_day':
      return '/day';
    case 'per_person':
      return '/person';
    default:
      return '';
  }
}

export function AddonSelector({
  addons,
  selectedAddons,
  onToggle,
  onQuantityChange,
  className,
}: AddonSelectorProps) {
  if (addons.length === 0) {
    return null;
  }

  const isSelected = (addonId: string) =>
    selectedAddons.some((a) => a.id === addonId);

  const getSelectedAddon = (addonId: string) =>
    selectedAddons.find((a) => a.id === addonId);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Package className="h-4 w-4 text-muted-foreground" />
          Add-ons
        </Label>
        <Badge variant="secondary" className="text-xs">
          Optional
        </Badge>
      </div>

      <div className="space-y-2">
        {addons.map((addon) => {
          const selected = isSelected(addon.id);
          const selectedAddon = getSelectedAddon(addon.id);

          return (
            <div
              key={addon.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                selected
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-border/50 hover:border-border hover:bg-muted/30'
              )}
              onClick={() => onToggle(addon)}
            >
              <Checkbox
                checked={selected}
                onCheckedChange={() => onToggle(addon)}
                className="mt-0.5"
                onClick={(e) => e.stopPropagation()}
              />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{addon.name}</p>
                {addon.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {addon.description}
                  </p>
                )}
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-medium text-primary">
                  {formatPrice(addon.price_centavos)}
                  <span className="text-xs font-normal text-muted-foreground">
                    {getPriceLabel(addon.price_type)}
                  </span>
                </p>
              </div>

              {/* Quantity control when selected */}
              {selected && selectedAddon && (
                <div
                  className="flex items-center gap-1 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() =>
                      onQuantityChange(addon.id, selectedAddon.quantity - 1)
                    }
                    disabled={selectedAddon.quantity <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm font-medium">
                    {selectedAddon.quantity}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() =>
                      onQuantityChange(addon.id, selectedAddon.quantity + 1)
                    }
                    disabled={selectedAddon.quantity >= 99}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
