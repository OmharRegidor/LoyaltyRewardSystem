'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { X } from 'lucide-react';
import type { ServiceFormData, HotelConfig } from '@/types/booking.types';

const SERVICE_TYPES = [
  { value: 'accommodation', label: 'Accommodation', description: 'Room or villa rental' },
  { value: 'tour', label: 'Tour Package', description: 'Guided tours and trips' },
  { value: 'activity', label: 'Activity', description: 'Experiences and activities' },
];

const COMMON_AMENITIES = [
  'WiFi', 'Air Conditioning', 'TV', 'Mini Bar', 'Safe', 'Room Service',
  'Balcony', 'Pool Access', 'Breakfast', 'Parking', 'Kitchen', 'Hot Tub',
];

interface HotelFieldsProps {
  formData: ServiceFormData;
  setFormData: React.Dispatch<React.SetStateAction<ServiceFormData>>;
  disabled?: boolean;
}

export function HotelFields({ formData, setFormData, disabled }: HotelFieldsProps) {
  const config = (formData.config as HotelConfig) || {
    service_type: 'accommodation',
    extra_person_fee_centavos: 0,
    capacity_base: 2,
    capacity_max: 4,
    check_in_time: '14:00',
    check_out_time: '11:00',
    amenities: [],
    min_stay_nights: 1,
    max_stay_nights: 30,
    advance_booking_days: 90,
    cutoff_hours: 24,
  };

  const updateConfig = (updates: Partial<HotelConfig>) => {
    setFormData((prev) => ({
      ...prev,
      config: { ...config, ...updates },
    }));
  };

  const toggleAmenity = (amenity: string) => {
    const currentAmenities = config.amenities || [];
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter((a) => a !== amenity)
      : [...currentAmenities, amenity];
    updateConfig({ amenities: newAmenities });
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
              onClick={() => updateConfig({ service_type: type.value as HotelConfig['service_type'] })}
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

      {config.service_type === 'accommodation' && (
        <>
          {/* Capacity */}
          <div className="space-y-2">
            <Label className="text-gray-900">Guest Capacity</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="20"
                value={config.capacity_base || 2}
                onChange={(e) => updateConfig({ capacity_base: parseInt(e.target.value) || 2 })}
                disabled={disabled}
                className="w-20"
              />
              <span className="text-sm text-gray-500">base, up to</span>
              <Input
                type="number"
                min="1"
                max="20"
                value={config.capacity_max || 4}
                onChange={(e) => updateConfig({ capacity_max: parseInt(e.target.value) || 4 })}
                disabled={disabled}
                className="w-20"
              />
              <span className="text-sm text-gray-500">max</span>
            </div>
          </div>

          {/* Extra Person Fee */}
          <div className="space-y-2">
            <Label htmlFor="extra_fee" className="text-gray-900">Extra Person Fee</Label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">₱</span>
              <Input
                id="extra_fee"
                type="number"
                min="0"
                value={(config.extra_person_fee_centavos || 0) / 100}
                onChange={(e) =>
                  updateConfig({ extra_person_fee_centavos: Math.round(parseFloat(e.target.value) * 100) || 0 })
                }
                disabled={disabled}
                className="w-28"
              />
              <span className="text-sm text-gray-500">per night (beyond base)</span>
            </div>
          </div>

          {/* Check-in/out Times */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkin" className="text-gray-900">Check-in Time</Label>
              <Input
                id="checkin"
                type="time"
                value={config.check_in_time || '14:00'}
                onChange={(e) => updateConfig({ check_in_time: e.target.value })}
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkout" className="text-gray-900">Check-out Time</Label>
              <Input
                id="checkout"
                type="time"
                value={config.check_out_time || '11:00'}
                onChange={(e) => updateConfig({ check_out_time: e.target.value })}
                disabled={disabled}
              />
            </div>
          </div>

          {/* Stay Duration */}
          <div className="space-y-2">
            <Label className="text-gray-900">Stay Duration Limits</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="30"
                value={config.min_stay_nights || 1}
                onChange={(e) => updateConfig({ min_stay_nights: parseInt(e.target.value) || 1 })}
                disabled={disabled}
                className="w-20"
              />
              <span className="text-sm text-gray-500">to</span>
              <Input
                type="number"
                min="1"
                max="365"
                value={config.max_stay_nights || 30}
                onChange={(e) => updateConfig({ max_stay_nights: parseInt(e.target.value) || 30 })}
                disabled={disabled}
                className="w-20"
              />
              <span className="text-sm text-gray-500">nights</span>
            </div>
          </div>

          {/* Number of Guests */}
          <div className="space-y-2">
            <Label htmlFor="inventory" className="text-gray-900">Number of Guests</Label>
            <Input
              id="inventory"
              type="number"
              min="1"
              value={formData.inventory_count || 1}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  inventory_count: parseInt(e.target.value) || 1,
                }))
              }
              disabled={disabled}
              className="w-24"
            />
            <p className="text-xs text-gray-500">
              Default number of guests for this booking type
            </p>
          </div>

          {/* Amenities */}
          <div className="space-y-2">
            <Label className="text-gray-900">Amenities</Label>
            <div className="flex flex-wrap gap-2">
              {COMMON_AMENITIES.map((amenity) => {
                const isSelected = (config.amenities || []).includes(amenity);
                return (
                  <Badge
                    key={amenity}
                    variant={isSelected ? 'default' : 'outline'}
                    className={`cursor-pointer ${
                      isSelected
                        ? 'bg-gray-900 text-white hover:bg-gray-800'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={() => !disabled && toggleAmenity(amenity)}
                  >
                    {amenity}
                    {isSelected && <X className="w-3 h-3 ml-1" />}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Diving Experience Toggle */}
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
            <div>
              <Label htmlFor="diving" className="text-gray-900">Add Diving Experience</Label>
              <p className="text-xs text-gray-500">
                Enable diving program add-ons for guests
              </p>
            </div>
            <Switch
              id="diving"
              checked={config.enable_diving_addons || false}
              onCheckedChange={(checked) => updateConfig({ enable_diving_addons: checked })}
              disabled={disabled}
            />
          </div>
        </>
      )}

      {/* Booking Rules */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <Label className="text-base text-gray-900">Booking Rules</Label>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="advance" className="text-gray-900">Advance Booking</Label>
            <div className="flex items-center gap-2">
              <Input
                id="advance"
                type="number"
                min="1"
                max="365"
                value={config.advance_booking_days || 90}
                onChange={(e) => updateConfig({ advance_booking_days: parseInt(e.target.value) || 90 })}
                disabled={disabled}
                className="w-20"
              />
              <span className="text-sm text-gray-500">days ahead</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cutoff" className="text-gray-900">Booking Cutoff</Label>
            <div className="flex items-center gap-2">
              <Input
                id="cutoff"
                type="number"
                min="0"
                max="72"
                value={config.cutoff_hours || 24}
                onChange={(e) => updateConfig({ cutoff_hours: parseInt(e.target.value) || 24 })}
                disabled={disabled}
                className="w-20"
              />
              <span className="text-sm text-gray-500">hours before</span>
            </div>
          </div>
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
            <span className="text-sm text-gray-500">% of total</span>
          </div>
        </div>
      </div>
    </div>
  );
}
