// apps/web/components/booking/fields/AddonSelector.tsx
'use client';

import { Package, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface AddonOption {
  id: string;
  name: string;
  price_centavos: number;
  description: string | null;
}

interface Addon {
  id: string;
  name: string;
  description: string | null;
  price_centavos: number;
  price_type: 'fixed' | 'per_day' | 'per_person';
  service_id: string | null;
  options?: AddonOption[];
}

interface SelectedAddonOption {
  id: string;
  name: string;
  priceCentavos: number;
}

interface SelectedAddon {
  id: string;
  name: string;
  priceCentavos: number;
  priceType: 'fixed' | 'per_day' | 'per_person';
  quantity: number;
  selectedOption?: SelectedAddonOption;
}

interface AddonSelectorProps {
  addons: Addon[];
  selectedAddons: SelectedAddon[];
  onToggle: (addon: Addon) => void;
  onQuantityChange: (addonId: string, quantity: number) => void;
  onOptionChange?: (addonId: string, option: SelectedAddonOption | null) => void;
  businessType?: 'retail' | 'restaurant' | 'salon' | 'hotel' | null;
  disabled?: boolean;
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
  onOptionChange,
  businessType,
  disabled = false,
  className,
}: AddonSelectorProps) {
  if (addons.length === 0) {
    return null;
  }

  const isSelected = (addonId: string) =>
    selectedAddons.some((a) => a.id === addonId);

  const getSelectedAddon = (addonId: string) =>
    selectedAddons.find((a) => a.id === addonId);

  // Hotels with options show dropdown, others show quantity
  const showDropdownForAddon = (addon: Addon) =>
    businessType === 'hotel' && addon.options && addon.options.length > 0;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Package className="h-4 w-4 text-gray-500" />
          {businessType === 'hotel' ? 'Add Experiences' : 'Add-ons'}
        </Label>
        <Badge variant="secondary" className="text-xs">
          Optional
        </Badge>
      </div>

      <div className="space-y-2">
        {addons.map((addon) => {
          const selected = isSelected(addon.id);
          const selectedAddon = getSelectedAddon(addon.id);
          const hasOptions = showDropdownForAddon(addon);

          return (
            <div
              key={addon.id}
              className={cn(
                'p-3 rounded-lg border transition-colors',
                selected
                  ? 'border-gray-400 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                disabled && 'opacity-60'
              )}
            >
              {/* Main addon row */}
              <div
                className={cn('flex items-start gap-3', !disabled && 'cursor-pointer')}
                onClick={() => !disabled && onToggle(addon)}
              >
                <Checkbox
                  checked={selected}
                  onCheckedChange={() => !disabled && onToggle(addon)}
                  disabled={disabled}
                  className="mt-0.5"
                  onClick={(e) => e.stopPropagation()}
                />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{addon.name}</p>
                  {addon.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                      {addon.description}
                    </p>
                  )}
                </div>

                {/* Show base price only if no options */}
                {!hasOptions && (
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-gray-900">
                      {formatPrice(addon.price_centavos)}
                      <span className="text-xs font-normal text-gray-500">
                        {getPriceLabel(addon.price_type)}
                      </span>
                    </p>
                  </div>
                )}

                {/* Quantity control for non-hotel or addons without options */}
                {selected && selectedAddon && !hasOptions && (
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
                      disabled={disabled || selectedAddon.quantity <= 1}
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
                      disabled={disabled || selectedAddon.quantity >= 99}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Dropdown for hotel addon options */}
              {selected && hasOptions && addon.options && (
                <div
                  className="mt-3 pl-7"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Label className="text-xs text-gray-500 mb-1.5 block">
                    Select program:
                  </Label>
                  <Select
                    value={selectedAddon?.selectedOption?.id || ''}
                    disabled={disabled}
                    onValueChange={(value) => {
                      if (!onOptionChange || disabled) return;
                      if (!value) {
                        onOptionChange(addon.id, null);
                        return;
                      }
                      const option = addon.options!.find((o) => o.id === value);
                      if (option) {
                        onOptionChange(addon.id, {
                          id: option.id,
                          name: option.name,
                          priceCentavos: option.price_centavos,
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Choose an option..." />
                    </SelectTrigger>
                    <SelectContent>
                      {addon.options.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          <div className="flex items-center justify-between w-full gap-4">
                            <span>{option.name}</span>
                            <span className="text-gray-500 text-sm">
                              {formatPrice(option.price_centavos)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedAddon?.selectedOption && (
                    <p className="text-xs text-gray-700 font-medium mt-2">
                      Selected: {selectedAddon.selectedOption.name} -{' '}
                      {formatPrice(selectedAddon.selectedOption.priceCentavos)}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
