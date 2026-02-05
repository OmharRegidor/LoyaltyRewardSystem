'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Settings2, DollarSign, HelpCircle, Users } from 'lucide-react';
import { BasicFields } from './basic-fields';
import { RetailFields } from './retail-fields';
import { RestaurantFields } from './restaurant-fields';
import { SalonFields } from './salon-fields';
import { HotelFields } from './hotel-fields';
import { StaffAssignment } from './staff-assignment';
import { PriceVariants } from './price-variants';
import { CustomQuestions } from './custom-questions';
import { getServiceWithConfig } from '@/lib/services/booking.service';
import type { Service, ServiceFormData, Branch, BusinessType } from '@/types/booking.types';

interface ServiceConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ServiceFormData) => Promise<void>;
  service?: Service | null;
  branches: Branch[];
  businessId: string;
  businessType: BusinessType | null;
  mode: 'create' | 'edit';
}

const DEFAULT_FORM_DATA: ServiceFormData = {
  name: '',
  description: '',
  duration_minutes: 30,
  price: null,
  branch_id: null,
  is_active: true,
  image_url: undefined,
  config: {},
  category: null,
  buffer_minutes: 0,
  pricing_type: 'fixed',
  deposit_percentage: 0,
  allow_staff_selection: false,
  inventory_count: 1,
  price_variants: [],
  questions: [],
};

export function ServiceConfigDialog({
  isOpen,
  onClose,
  onSave,
  service,
  branches,
  businessId,
  businessType,
  mode,
}: ServiceConfigDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState<ServiceFormData>(DEFAULT_FORM_DATA);

  // Reset form when dialog opens/closes or service changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab('basic');

      if (service && mode === 'edit') {
        loadServiceConfig(service.id);
      } else {
        setFormData({
          ...DEFAULT_FORM_DATA,
          config: getDefaultConfigForBusinessType(businessType),
        });
      }
    }
  }, [isOpen, service, mode, businessType]);

  const loadServiceConfig = async (serviceId: string) => {
    setIsLoading(true);
    try {
      const fullService = await getServiceWithConfig(serviceId);
      if (fullService) {
        setFormData({
          name: fullService.name,
          description: fullService.description || '',
          duration_minutes: fullService.duration_minutes,
          price: fullService.price_centavos ? fullService.price_centavos / 100 : null,
          branch_id: fullService.branch_id,
          is_active: fullService.is_active,
          image_url: fullService.image_url || undefined,
          config: fullService.config || {},
          category: fullService.category,
          buffer_minutes: fullService.buffer_minutes,
          pricing_type: fullService.pricing_type,
          deposit_percentage: fullService.deposit_percentage,
          allow_staff_selection: fullService.allow_staff_selection,
          inventory_count: fullService.inventory_count,
          price_variants: fullService.price_variants || [],
          questions: fullService.questions || [],
        });
      }
    } catch (error) {
      console.error('Error loading service config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultConfigForBusinessType = (type: BusinessType | null) => {
    switch (type) {
      case 'retail':
        return { service_type: 'appointment' };
      case 'restaurant':
        return {
          service_type: 'table',
          party_size_min: 1,
          party_size_max: 4,
          slot_duration_minutes: 90,
          time_interval_minutes: 30,
        };
      case 'salon':
        return {};
      case 'hotel':
        return {
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
      default:
        return {};
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving service:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBusinessTypeFields = () => {
    switch (businessType) {
      case 'retail':
        return <RetailFields formData={formData} setFormData={setFormData} disabled={isSubmitting} />;
      case 'restaurant':
        return <RestaurantFields formData={formData} setFormData={setFormData} disabled={isSubmitting} />;
      case 'salon':
        return <SalonFields formData={formData} setFormData={setFormData} disabled={isSubmitting} />;
      case 'hotel':
        return <HotelFields formData={formData} setFormData={setFormData} disabled={isSubmitting} />;
      default:
        return <SalonFields formData={formData} setFormData={setFormData} disabled={isSubmitting} />;
    }
  };

  const getBusinessTypeLabel = () => {
    switch (businessType) {
      case 'retail':
        return 'Service Options';
      case 'restaurant':
        return 'Table Settings';
      case 'salon':
        return 'Service Settings';
      case 'hotel':
        return 'Accommodation Settings';
      default:
        return 'Service Settings';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add Service' : 'Edit Service'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {mode === 'create' ? 'Create a new service' : 'Edit service details'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" className="flex items-center gap-1.5">
                  <Settings2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Basic</span>
                </TabsTrigger>
                <TabsTrigger value="config" className="flex items-center gap-1.5">
                  <Settings2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Config</span>
                </TabsTrigger>
                <TabsTrigger value="pricing" className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pricing</span>
                </TabsTrigger>
                <TabsTrigger value="questions" className="flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Questions</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-auto py-4">
                <TabsContent value="basic" className="mt-0 data-[state=inactive]:hidden">
                  <BasicFields
                    formData={formData}
                    setFormData={setFormData}
                    branches={branches}
                    disabled={isSubmitting}
                  />
                </TabsContent>

                <TabsContent value="config" className="mt-0 data-[state=inactive]:hidden">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-3">{getBusinessTypeLabel()}</h3>
                      {renderBusinessTypeFields()}
                    </div>

                    <div className="border-t pt-4">
                      <StaffAssignment
                        formData={formData}
                        setFormData={setFormData}
                        businessId={businessId}
                        serviceId={service?.id}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="pricing" className="mt-0 data-[state=inactive]:hidden">
                  <PriceVariants
                    formData={formData}
                    setFormData={setFormData}
                    disabled={isSubmitting}
                  />
                </TabsContent>

                <TabsContent value="questions" className="mt-0 data-[state=inactive]:hidden">
                  <CustomQuestions
                    formData={formData}
                    setFormData={setFormData}
                    disabled={isSubmitting}
                  />
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="border-t pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'create' ? 'Add Service' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Re-export for convenience
export { BasicFields } from './basic-fields';
export { RetailFields } from './retail-fields';
export { RestaurantFields } from './restaurant-fields';
export { SalonFields } from './salon-fields';
export { HotelFields } from './hotel-fields';
export { StaffAssignment } from './staff-assignment';
export { PriceVariants } from './price-variants';
export { CustomQuestions } from './custom-questions';
