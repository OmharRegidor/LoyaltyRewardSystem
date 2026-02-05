// apps/web/app/dashboard/booking/business-form/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase';
import {
  getOrCreateDefaultService,
  getBusinessType,
  updateServiceWithConfig,
} from '@/lib/services/booking.service';
import { motion } from 'framer-motion';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import { SettingsPanel } from '@/components/booking/business-form/settings-panel';
import { PreviewPanel } from '@/components/booking/business-form/preview-panel';

import type { ServiceFormData, BusinessType, ServiceWithConfig } from '@/types/booking.types';

// ============================================
// DEFAULT FORM DATA
// ============================================

const DEFAULT_FORM_DATA: ServiceFormData = {
  name: '',
  description: '',
  duration_minutes: 60,
  price: null,
  branch_id: null,
  is_active: true,
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

// ============================================
// LOADING SKELETON
// ============================================

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-80" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Settings skeleton */}
        <div className="lg:col-span-3 space-y-4">
          <Skeleton className="h-6 w-32 mb-3" />
          <div className="rounded-lg border bg-white shadow-md p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
        {/* Preview skeleton */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border bg-white shadow-md p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function BusinessFormPage() {
  const [formData, setFormData] = useState<ServiceFormData>(DEFAULT_FORM_DATA);
  const [originalFormData, setOriginalFormData] = useState<ServiceFormData>(DEFAULT_FORM_DATA);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ============================================
  // LOAD DATA
  // ============================================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: business } = await supabase
        .from('businesses')
        .select('id, business_type')
        .eq('owner_id', user.id)
        .single();

      if (!business) return;

      setBusinessId(business.id);
      const type = (business.business_type as BusinessType) || null;
      setBusinessType(type);

      // Get or create the default service
      const service = await getOrCreateDefaultService(business.id, type);
      setServiceId(service.id);

      // Populate form data from service
      const data: ServiceFormData = {
        name: service.name,
        description: service.description || '',
        duration_minutes: service.duration_minutes,
        price: service.price_centavos ? service.price_centavos / 100 : null,
        branch_id: service.branch_id,
        is_active: service.is_active,
        image_url: service.image_url || undefined,
        config: service.config || {},
        category: service.category,
        buffer_minutes: service.buffer_minutes,
        pricing_type: service.pricing_type,
        deposit_percentage: service.deposit_percentage,
        allow_staff_selection: service.allow_staff_selection,
        inventory_count: service.inventory_count,
        price_variants: service.price_variants || [],
        questions: service.questions || [],
      };

      setFormData(data);
      setOriginalFormData(data);
    } catch (error) {
      console.error('Error loading business form data:', error);
      toast.error('Failed to load form settings');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // CHECK FOR UNSAVED CHANGES
  // ============================================

  const hasChanges = useCallback(() => {
    return JSON.stringify(formData) !== JSON.stringify(originalFormData);
  }, [formData, originalFormData]);

  // ============================================
  // SAVE HANDLER
  // ============================================

  const handleSave = async () => {
    if (!serviceId || !formData.name.trim()) {
      toast.error('Service name is required');
      return;
    }

    setIsSaving(true);

    try {
      await updateServiceWithConfig(serviceId, formData);
      setOriginalFormData(formData);
      toast.success('Business form saved successfully');
    } catch (error) {
      console.error('Error saving business form:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingSkeleton />
      </DashboardLayout>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <DashboardLayout>
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 ">
              Business Form
            </h1>
            <p className="text-sm text-gray-500  mt-1">
              Configure what customers see when booking
            </p>
          </div>

          {/* Save Button - visible on desktop */}
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges()}
            className="hidden sm:flex"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Settings Panel (60% on desktop) */}
          <div className="lg:col-span-3">
            <div className="rounded-lg border bg-white shadow-md p-4 sm:p-6">
              <SettingsPanel
                formData={formData}
                setFormData={setFormData}
                businessType={businessType}
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Preview Panel (40% on desktop) */}
          <div className="lg:col-span-2">
            <PreviewPanel
              formData={formData}
              businessType={businessType}
            />
          </div>
        </div>

        {/* Mobile Save Button - Fixed at bottom */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-white  border-t shadow-lg z-20">
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges()}
            className="w-full"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        {/* Spacer for mobile fixed button */}
        <div className="sm:hidden h-20" />
      </motion.div>
    </DashboardLayout>
  );
}
