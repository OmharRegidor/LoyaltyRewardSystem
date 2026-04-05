'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Loader2,
  X,
  ImageIcon,
  Clock,
  Users,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase';
import type { Service, ServiceFormData, PricingType, DurationUnit } from '@/types/service.types';
import { PRICING_TYPE_LABELS, DURATION_UNIT_LABELS } from '@/types/service.types';

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  onSave: (service: Service) => void;
}

const defaultFormData: ServiceFormData = {
  name: '',
  description: '',
  price: 0,
  pricing_type: 'fixed',
  duration_minutes: 30,
  duration_unit: 'minutes',
  category: '',
  image_url: '',
  is_active: true,
  allow_staff_selection: false,
};

const DURATION_MAX: Record<DurationUnit, number> = {
  minutes: 1440,
  hours: 72,
  days: 30,
  nights: 30,
};

const DURATION_STEP: Record<DurationUnit, number> = {
  minutes: 5,
  hours: 1,
  days: 1,
  nights: 1,
};

const DURATION_DEFAULT: Record<DurationUnit, number> = {
  minutes: 30,
  hours: 1,
  days: 1,
  nights: 1,
};

export function ServiceFormDialog({
  open,
  onOpenChange,
  service,
  onSave,
}: ServiceFormDialogProps) {
  const [formData, setFormData] = useState<ServiceFormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when dialog opens/closes or service changes
  useEffect(() => {
    if (open && service) {
      setFormData({
        name: service.name,
        description: service.description || '',
        price: service.price_centavos / 100,
        pricing_type: service.pricing_type,
        duration_minutes: service.duration_minutes,
        duration_unit: service.duration_unit || 'minutes',
        category: service.category || '',
        image_url: service.image_url || '',
        is_active: service.is_active,
        max_guests: service.max_guests ?? undefined,
        allow_staff_selection: service.allow_staff_selection,
      });
      setImagePreview(service.image_url || null);
    } else if (open) {
      setFormData(defaultFormData);
      setImagePreview(null);
    }
  }, [open, service]);

  const handleClose = () => {
    onOpenChange(false);
    setFormData(defaultFormData);
    setImagePreview(null);
  };

  const handleDurationUnitChange = (unit: DurationUnit) => {
    setFormData((prev) => ({
      ...prev,
      duration_unit: unit,
      duration_minutes: DURATION_DEFAULT[unit],
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `service-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Failed to upload image. Please try again.');
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, image_url: publicUrl }));
      setImagePreview(publicUrl);
    } catch (err) {
      console.error('Failed to upload image:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image_url: '' }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!formData.name || formData.price < 0) return;

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        description: formData.description || undefined,
        category: formData.category || undefined,
        image_url: formData.image_url || undefined,
        max_guests: formData.max_guests || undefined,
      };

      const url = service
        ? `/api/dashboard/pos/services/${service.id}`
        : '/api/dashboard/pos/services';
      const method = service ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        onSave(data.service);
        handleClose();
      }
    } catch (err) {
      console.error('Failed to save service:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-h-[95dvh] sm:max-h-[85vh] flex flex-col overflow-hidden p-4 sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {service ? 'Edit Service' : 'Add Service'}
          </DialogTitle>
        </DialogHeader>

        <form
          id="service-form"
          onSubmit={(e) => { e.preventDefault(); handleSave(); }}
          className="space-y-3 sm:space-y-4 py-3 sm:py-4 overflow-y-auto flex-1 -mx-4 px-4 sm:-mx-6 sm:px-6"
        >
          {/* Name & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="service-name">Name *</Label>
              <Input
                id="service-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Consultation, Massage"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="service-price">Price ({'\u20B1'}) *</Label>
              <Input
                id="service-price"
                type="number"
                value={formData.price || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, price: Math.min(parseFloat(e.target.value) || 0, 999999.99) }))
                }
                placeholder="0.00"
                min="0"
                max="999999.99"
                step="0.01"
              />
            </div>
          </div>

          {/* Pricing Type & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label>Pricing Type</Label>
              <Select
                value={formData.pricing_type}
                onValueChange={(value: PricingType) =>
                  setFormData((prev) => ({ ...prev, pricing_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pricing type" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(PRICING_TYPE_LABELS) as [PricingType, string][]).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="service-duration">Duration</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="service-duration"
                    type="number"
                    value={formData.duration_minutes || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        duration_minutes: Math.min(
                          parseInt(e.target.value) || 0,
                          DURATION_MAX[prev.duration_unit]
                        ),
                      }))
                    }
                    placeholder={String(DURATION_DEFAULT[formData.duration_unit])}
                    min="1"
                    max={DURATION_MAX[formData.duration_unit]}
                    step={DURATION_STEP[formData.duration_unit]}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={formData.duration_unit}
                  onValueChange={(value: DurationUnit) => handleDurationUnitChange(value)}
                >
                  <SelectTrigger className="w-[110px] shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(DURATION_UNIT_LABELS) as [DurationUnit, string][]).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Category & Max Guests */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="service-category">Category</Label>
              <Input
                id="service-category"
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Basic, Premium, Add-on"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="service-max-guests">Max Capacity</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="service-max-guests"
                  type="number"
                  value={formData.max_guests || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      max_guests: parseInt(e.target.value) || undefined,
                    }))
                  }
                  placeholder="No limit"
                  min="1"
                  max="999"
                  className="pl-9"
                />
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Max guests or pax per session
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="service-description">Description</Label>
            <Input
              id="service-description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Optional description"
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label>Service Image</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative w-full h-28 sm:h-32 rounded-lg overflow-hidden border">
                <img
                  src={imagePreview}
                  alt="Service preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full h-24 sm:h-32 flex flex-col items-center justify-center gap-1.5 sm:gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                    <span className="text-xs sm:text-sm">Uploading...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span className="text-xs sm:text-sm">Upload Image</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Max 2MB</span>
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3 sm:p-4">
            <div className="space-y-0.5">
              <Label>Active</Label>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Inactive services won&apos;t appear in POS
              </p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, is_active: checked }))
              }
            />
          </div>
        </form>

        <DialogFooter className="shrink-0 pt-2 border-t">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="service-form"
            disabled={isSaving || !formData.name || formData.price < 0}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {service ? 'Save Changes' : 'Add Service'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
