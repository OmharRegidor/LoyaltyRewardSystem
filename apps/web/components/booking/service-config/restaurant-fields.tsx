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
import type { ServiceFormData, RestaurantConfig } from '@/types/booking.types';

const SERVICE_TYPES = [
  { value: 'table', label: 'Table Reservation', description: 'Regular dining table' },
  { value: 'private_dining', label: 'Private Dining', description: 'Private room or area' },
  { value: 'event', label: 'Event Space', description: 'For parties or events' },
];

const TIME_INTERVALS = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
];

interface RestaurantFieldsProps {
  formData: ServiceFormData;
  setFormData: React.Dispatch<React.SetStateAction<ServiceFormData>>;
  disabled?: boolean;
}

export function RestaurantFields({ formData, setFormData, disabled }: RestaurantFieldsProps) {
  const config = (formData.config as RestaurantConfig) || {
    service_type: 'table',
    party_size_min: 1,
    party_size_max: 4,
    slot_duration_minutes: 90,
    time_interval_minutes: 30,
  };

  const updateConfig = (updates: Partial<RestaurantConfig>) => {
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
              onClick={() => updateConfig({ service_type: type.value as RestaurantConfig['service_type'] })}
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

      {/* Party Size */}
      <div className="space-y-2">
        <Label className="text-gray-900">Party Size Range</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="1"
            max="50"
            value={config.party_size_min || 1}
            onChange={(e) => updateConfig({ party_size_min: parseInt(e.target.value) || 1 })}
            disabled={disabled}
            className="w-20"
          />
          <span className="text-sm text-gray-500">to</span>
          <Input
            type="number"
            min="1"
            max="100"
            value={config.party_size_max || 4}
            onChange={(e) => updateConfig({ party_size_max: parseInt(e.target.value) || 4 })}
            disabled={disabled}
            className="w-20"
          />
          <span className="text-sm text-gray-500">guests</span>
        </div>
      </div>

      {/* Slot Duration */}
      <div className="space-y-2">
        <Label htmlFor="slot_duration" className="text-gray-900">Default Dining Duration</Label>
        <div className="flex items-center gap-2">
          <Input
            id="slot_duration"
            type="number"
            min="30"
            max="480"
            step="15"
            value={config.slot_duration_minutes || 90}
            onChange={(e) => updateConfig({ slot_duration_minutes: parseInt(e.target.value) || 90 })}
            disabled={disabled}
            className="w-24"
          />
          <span className="text-sm text-gray-500">minutes</span>
        </div>
        <p className="text-xs text-gray-500">
          How long a table is typically occupied
        </p>
      </div>

      {/* Time Intervals */}
      <div className="space-y-2">
        <Label className="text-gray-900">Booking Time Intervals</Label>
        <Select
          value={String(config.time_interval_minutes || 30)}
          onValueChange={(value) => updateConfig({ time_interval_minutes: parseInt(value) })}
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select interval" />
          </SelectTrigger>
          <SelectContent>
            {TIME_INTERVALS.map((interval) => (
              <SelectItem key={interval.value} value={interval.value}>
                {interval.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          Customers can book at these intervals (e.g., 6:00, 6:30, 7:00)
        </p>
      </div>

      {/* Deposit */}
      <div className="space-y-2">
        <Label htmlFor="deposit" className="text-gray-900">Deposit Required</Label>
        <div className="flex items-center gap-2">
          <Input
            id="deposit"
            type="number"
            min="0"
            max="100"
            value={formData.deposit_percentage || 0}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                deposit_percentage: parseInt(e.target.value) || 0,
              }))
            }
            disabled={disabled}
            className="w-20"
          />
          <span className="text-sm text-gray-500">%</span>
        </div>
        <p className="text-xs text-gray-500">
          Percentage of total bill required as deposit (0 = no deposit)
        </p>
      </div>
    </div>
  );
}
