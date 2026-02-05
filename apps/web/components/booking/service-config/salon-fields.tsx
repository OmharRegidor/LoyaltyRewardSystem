'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ServiceFormData, PricingType } from '@/types/booking.types';

const CATEGORIES = [
  { value: 'hair', label: 'Hair Services' },
  { value: 'nails', label: 'Nail Services' },
  { value: 'facial', label: 'Facial & Skincare' },
  { value: 'massage', label: 'Massage & Body' },
  { value: 'makeup', label: 'Makeup & Styling' },
  { value: 'waxing', label: 'Waxing & Hair Removal' },
  { value: 'other', label: 'Other' },
];

const PRICING_TYPES: { value: PricingType; label: string }[] = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'starting_at', label: 'Starting At' },
  { value: 'per_session', label: 'Per Session' },
];

interface SalonFieldsProps {
  formData: ServiceFormData;
  setFormData: React.Dispatch<React.SetStateAction<ServiceFormData>>;
  disabled?: boolean;
}

export function SalonFields({ formData, setFormData, disabled }: SalonFieldsProps) {
  return (
    <div className="space-y-4">
      {/* Category */}
      <div className="space-y-2">
        <Label className="text-gray-900">Service Category</Label>
        <Select
          value={formData.category || ''}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, category: value }))
          }
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pricing Type */}
      <div className="space-y-2">
        <Label className="text-gray-900">Pricing Type</Label>
        <Select
          value={formData.pricing_type || 'fixed'}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, pricing_type: value as PricingType }))
          }
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select pricing type" />
          </SelectTrigger>
          <SelectContent>
            {PRICING_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          &quot;Starting At&quot; indicates prices may vary based on hair length, complexity, etc.
        </p>
      </div>

      {/* Buffer Time */}
      <div className="space-y-2">
        <Label htmlFor="buffer" className="text-gray-900">Buffer Time Between Appointments</Label>
        <div className="flex items-center gap-2">
          <Input
            id="buffer"
            type="number"
            min="0"
            max="60"
            value={formData.buffer_minutes || 0}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                buffer_minutes: parseInt(e.target.value) || 0,
              }))
            }
            disabled={disabled}
            className="w-24"
          />
          <span className="text-sm text-gray-500">minutes</span>
        </div>
        <p className="text-xs text-gray-500">
          Time for cleanup or preparation between clients
        </p>
      </div>

      {/* Allow Staff Selection */}
      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white">
        <div className="space-y-0.5">
          <Label htmlFor="staff_selection" className="text-gray-900">Allow Customer Staff Selection</Label>
          <p className="text-xs text-gray-500">
            Let customers choose their preferred stylist/technician
          </p>
        </div>
        <Switch
          id="staff_selection"
          checked={formData.allow_staff_selection || false}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({ ...prev, allow_staff_selection: checked }))
          }
          disabled={disabled}
        />
      </div>
    </div>
  );
}
