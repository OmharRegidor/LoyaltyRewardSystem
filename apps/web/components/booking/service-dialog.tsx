// apps/web/components/booking/service-dialog.tsx

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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Loader2, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import type { Service, ServiceFormData, Branch } from '@/types/booking.types';

// ============================================
// CONSTANTS
// ============================================

const DURATION_OPTIONS = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1 hr 30 min' },
  { value: '120', label: '2 hours' },
];

// ============================================
// TYPES
// ============================================

interface ServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ServiceFormData) => Promise<void>;
  service?: Service | null;
  branches: Branch[];
  mode: 'create' | 'edit';
}

// ============================================
// COMPONENT
// ============================================

export function ServiceDialog({
  isOpen,
  onClose,
  onSave,
  service,
  branches,
  mode,
}: ServiceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    duration_minutes: 30,
    price: null,
    branch_id: null,
    is_active: true,
    image_url: undefined,
  });

  // Reset form when dialog opens/closes or service changes
  useEffect(() => {
    if (isOpen) {
      if (service && mode === 'edit') {
        setFormData({
          name: service.name,
          description: service.description || '',
          duration_minutes: service.duration_minutes,
          price: service.price_centavos ? service.price_centavos / 100 : null,
          branch_id: service.branch_id,
          is_active: service.is_active,
          image_url: service.image_url || undefined,
        });
        setImagePreview(service.image_url || null);
      } else {
        setFormData({
          name: '',
          description: '',
          duration_minutes: 30,
          price: null,
          branch_id: null,
          is_active: true,
          image_url: undefined,
        });
        setImagePreview(null);
      }
      setUploadError(null);
    }
  }, [isOpen, service, mode]);

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

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setFormData((prev) => ({ ...prev, price: null }));
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        setFormData((prev) => ({ ...prev, price: numValue }));
      }
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image must be less than 2MB');
      return;
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Only PNG, JPG, and WebP images are allowed');
      return;
    }

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    // Upload to Supabase
    setIsUploadingImage(true);

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `service-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from('reward-images')
        .upload(fileName, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('reward-images')
        .getPublicUrl(fileName);

      // Update form data with the uploaded URL
      setFormData((prev) => ({ ...prev, image_url: urlData.publicUrl }));
    } catch (error) {
      console.error('Image upload error:', error);
      setUploadError('Failed to upload image. Please try again.');
      setImagePreview(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add Service' : 'Edit Service'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {mode === 'create' ? 'Create a new service' : 'Edit service details'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g., Haircut, Massage"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Optional description of the service"
              rows={3}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Service Image</Label>
            <label className="block cursor-pointer">
              <Card className="border-2 border-dashed p-4 flex flex-col items-center justify-center hover:bg-muted/50 hover:border-primary/50 transition h-32 relative overflow-hidden">
                {imagePreview ? (
                  <>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-center text-white">
                        <Upload className="w-6 h-6 mx-auto mb-1" />
                        <p className="text-xs font-medium">Change image</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {isUploadingImage ? (
                      <Loader2 className="w-6 h-6 text-primary animate-spin mb-1" />
                    ) : (
                      <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                    )}
                    <p className="text-xs font-medium">
                      {isUploadingImage ? 'Uploading...' : 'Click to upload'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG up to 2MB
                    </p>
                  </>
                )}
              </Card>
              <input
                type="file"
                className="hidden"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleImageSelect}
                disabled={isSubmitting || isUploadingImage}
              />
            </label>
            {uploadError && (
              <p className="text-xs text-red-500">{uploadError}</p>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration *</Label>
            <Select
              value={String(formData.duration_minutes)}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  duration_minutes: parseInt(value),
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ₱
              </span>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price ?? ''}
                onChange={handlePriceChange}
                placeholder="0.00"
                className="pl-7"
              />
            </div>
          </div>

          {/* Branch */}
          {branches.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Select
                value={formData.branch_id || 'all'}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    branch_id: value === 'all' ? null : value,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All branches</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Active Status */}
          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Active</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, is_active: checked }))
              }
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploadingImage || !formData.name.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Add Service' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
