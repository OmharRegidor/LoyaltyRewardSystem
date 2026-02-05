'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ServiceFormData, RetailConfig, PricingType } from '@/types/booking.types';

const SERVICE_TYPES = [
  { value: 'appointment', label: 'Appointment', description: 'One-on-one scheduled service' },
  { value: 'pickup', label: 'Pickup', description: 'Order for customer pickup' },
  { value: 'reservation', label: 'Reservation', description: 'Reserve a time slot or item' },
];

const PRICING_TYPES: { value: PricingType; label: string }[] = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'per_hour', label: 'Per Hour' },
  { value: 'per_session', label: 'Per Session' },
  { value: 'starting_at', label: 'Starting At' },
];

interface RetailFieldsProps {
  formData: ServiceFormData;
  setFormData: React.Dispatch<React.SetStateAction<ServiceFormData>>;
  disabled?: boolean;
}

export function RetailFields({ formData, setFormData, disabled }: RetailFieldsProps) {
  const config = (formData.config as RetailConfig) || { service_type: 'appointment' };

  const updateConfig = (updates: Partial<RetailConfig>) => {
    setFormData((prev) => ({
      ...prev,
      config: { ...config, ...updates },
    }));
  };

  return (
    <div className="space-y-4">
      {/* Service Type */}
      <div className="space-y-2">
        <Label className="text-gray-900">Service Type</Label>
        <div className="grid gap-2">
          {SERVICE_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => updateConfig({ service_type: type.value as RetailConfig['service_type'] })}
              disabled={disabled}
              className={`p-3 rounded-lg border-2 text-left transition-all bg-white ${
                config.service_type === type.value
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-400'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <p className="font-medium text-sm text-gray-900">{type.label}</p>
              <p className="text-xs text-gray-500">{type.description}</p>
            </button>
          ))}
        </div>
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
      </div>

      {/* Buffer Time */}
      <div className="space-y-2">
        <Label htmlFor="buffer" className="text-gray-900">Buffer Time Between Bookings</Label>
        <div className="flex items-center gap-2">
          <Input
            id="buffer"
            type="number"
            min="0"
            max="120"
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
          Extra time between appointments for preparation or cleanup
        </p>
      </div>
    </div>
  );
}
