'use client';

import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

import { HotelFields } from '../service-config/hotel-fields';
import { RestaurantFields } from '../service-config/restaurant-fields';
import { SalonFields } from '../service-config/salon-fields';
import { RetailFields } from '../service-config/retail-fields';
import { PriceVariants } from '../service-config/price-variants';

import type { ServiceFormData, BusinessType } from '@/types/booking.types';

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  hotel: 'Hotel / Accommodation',
  restaurant: 'Restaurant',
  salon: 'Salon / Spa',
  retail: 'Retail / General',
};

interface SettingsPanelProps {
  formData: ServiceFormData;
  setFormData: React.Dispatch<React.SetStateAction<ServiceFormData>>;
  businessType: BusinessType | null;
  disabled?: boolean;
}

export function SettingsPanel({
  formData,
  setFormData,
  businessType,
  disabled,
}: SettingsPanelProps) {
  const [isPriceVariantsOpen, setIsPriceVariantsOpen] = useState(
    (formData.price_variants?.length || 0) > 0
  );

  const renderBusinessTypeFields = () => {
    switch (businessType) {
      case 'hotel':
        return <HotelFields formData={formData} setFormData={setFormData} disabled={disabled} />;
      case 'restaurant':
        return <RestaurantFields formData={formData} setFormData={setFormData} disabled={disabled} />;
      case 'salon':
        return <SalonFields formData={formData} setFormData={setFormData} disabled={disabled} />;
      case 'retail':
        return <RetailFields formData={formData} setFormData={setFormData} disabled={disabled} />;
      default:
        return <SalonFields formData={formData} setFormData={setFormData} disabled={disabled} />;
    }
  };

  const getBusinessTypeSettingsLabel = () => {
    switch (businessType) {
      case 'hotel':
        return 'Accommodation Settings';
      case 'restaurant':
        return 'Table Settings';
      case 'salon':
        return 'Service Settings';
      case 'retail':
        return 'Booking Settings';
      default:
        return 'Service Settings';
    }
  };

  return (
    <div className="space-y-6">
      {/* Business Type Badge */}
      {businessType && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm bg-gray-100 text-gray-900 border border-gray-300">
            {BUSINESS_TYPE_LABELS[businessType]}
          </Badge>
        </div>
      )}

      {/* Business Type Specific Settings */}
      <section className="space-y-4">
        <h3 className="font-semibold text-lg border-b border-gray-200 pb-2 text-gray-900">
          {getBusinessTypeSettingsLabel()}
        </h3>
        {renderBusinessTypeFields()}
      </section>

      {/* Price Variants Section (Collapsible) */}
      <Collapsible open={isPriceVariantsOpen} onOpenChange={setIsPriceVariantsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors bg-white">
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Price Variants</h3>
            <p className="text-xs text-gray-600">
              Add pricing options (e.g., room types, table sizes)
            </p>
          </div>
          {isPriceVariantsOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <PriceVariants
            formData={formData}
            setFormData={setFormData}
            disabled={disabled}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
