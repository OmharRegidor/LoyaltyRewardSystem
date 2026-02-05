'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { PriceVariant, ServiceFormData } from '@/types/booking.types';

interface PriceVariantsProps {
  formData: ServiceFormData;
  setFormData: React.Dispatch<React.SetStateAction<ServiceFormData>>;
  disabled?: boolean;
}

export function PriceVariants({ formData, setFormData, disabled }: PriceVariantsProps) {
  const variants = formData.price_variants || [];

  const addVariant = () => {
    const newVariant: PriceVariant = {
      name: '',
      price_centavos: 0,
      description: null,
      capacity: null,
      sort_order: variants.length,
      is_active: true,
    };
    setFormData((prev) => ({
      ...prev,
      price_variants: [...(prev.price_variants || []), newVariant],
    }));
  };

  const updateVariant = (index: number, updates: Partial<PriceVariant>) => {
    setFormData((prev) => ({
      ...prev,
      price_variants: (prev.price_variants || []).map((v, i) =>
        i === index ? { ...v, ...updates } : v
      ),
    }));
  };

  const removeVariant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      price_variants: (prev.price_variants || []).filter((_, i) => i !== index),
    }));
  };

  const moveVariant = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= variants.length) return;
    setFormData((prev) => {
      const newVariants = [...(prev.price_variants || [])];
      const [removed] = newVariants.splice(fromIndex, 1);
      newVariants.splice(toIndex, 0, removed);
      return { ...prev, price_variants: newVariants };
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base text-gray-900">Price Variants</Label>
          <p className="text-xs text-gray-500 mt-1">
            Add different pricing options (e.g., Short Hair / Long Hair, Table for 2 / Table for 4)
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addVariant}
          disabled={disabled}
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Variant
        </Button>
      </div>

      {variants.length === 0 ? (
        <Card className="p-8 text-center border-dashed bg-white border-gray-200">
          <p className="text-gray-600 text-sm">No price variants added</p>
          <p className="text-xs text-gray-500 mt-1">
            Click &quot;Add Variant&quot; to create pricing options
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {variants.map((variant, index) => (
            <Card key={index} className="p-4 bg-white border-gray-200">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  className="mt-1 cursor-grab text-gray-500 hover:text-gray-700"
                  onMouseDown={(e) => e.preventDefault()}
                  disabled={disabled}
                >
                  <GripVertical className="w-4 h-4" />
                </button>

                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Name */}
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-700">Variant Name *</Label>
                      <Input
                        value={variant.name}
                        onChange={(e) => updateVariant(index, { name: e.target.value })}
                        placeholder="e.g., Short Hair"
                        className="bg-white border-gray-300 text-gray-900"
                        disabled={disabled}
                      />
                    </div>

                    {/* Price */}
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-700">Price *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                          ₱
                        </span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={variant.price_centavos / 100 || ''}
                          onChange={(e) =>
                            updateVariant(index, {
                              price_centavos: Math.round(parseFloat(e.target.value) * 100) || 0,
                            })
                          }
                          placeholder="0.00"
                          className="pl-7 bg-white border-gray-300 text-gray-900"
                          disabled={disabled}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Description */}
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-700">Description</Label>
                      <Input
                        value={variant.description || ''}
                        onChange={(e) =>
                          updateVariant(index, { description: e.target.value || null })
                        }
                        placeholder="Optional description"
                        className="bg-white border-gray-300 text-gray-900"
                        disabled={disabled}
                      />
                    </div>

                    {/* Capacity */}
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-700">Capacity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={variant.capacity || ''}
                        onChange={(e) =>
                          updateVariant(index, {
                            capacity: parseInt(e.target.value) || null,
                          })
                        }
                        placeholder="e.g., 4 guests"
                        className="bg-white border-gray-300 text-gray-900"
                        disabled={disabled}
                      />
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={variant.is_active}
                      onCheckedChange={(checked) =>
                        updateVariant(index, { is_active: checked })
                      }
                      disabled={disabled}
                    />
                    <span className="text-xs text-gray-600">Active</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => moveVariant(index, index - 1)}
                    disabled={disabled || index === 0}
                    className="text-gray-500"
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => moveVariant(index, index + 1)}
                    disabled={disabled || index === variants.length - 1}
                    className="text-gray-500"
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeVariant(index)}
                    disabled={disabled}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
