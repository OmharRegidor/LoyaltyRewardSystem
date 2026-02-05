'use client';

import { useState } from 'react';
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
import { Upload, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import type { ServiceFormData, Branch } from '@/types/booking.types';

const DURATION_OPTIONS = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1 hr 30 min' },
  { value: '120', label: '2 hours' },
  { value: '180', label: '3 hours' },
  { value: '240', label: '4 hours' },
];

interface BasicFieldsProps {
  formData: ServiceFormData;
  setFormData: React.Dispatch<React.SetStateAction<ServiceFormData>>;
  branches: Branch[];
  disabled?: boolean;
}

export function BasicFields({ formData, setFormData, branches, disabled }: BasicFieldsProps) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(formData.image_url || null);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image must be less than 2MB');
      return;
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Only PNG, JPG, and WebP images are allowed');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setIsUploadingImage(true);

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `service-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from('reward-images')
        .upload(fileName, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from('reward-images')
        .getPublicUrl(fileName);

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
    <div className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-gray-900">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Haircut, Massage, Table for 2"
          disabled={disabled}
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-gray-900">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Optional description of the service"
          rows={3}
          disabled={disabled}
        />
      </div>

      {/* Image Upload */}
      <div className="space-y-2">
        <Label className="text-gray-900">Service Image</Label>
        <label className="block cursor-pointer">
          <Card className="border-2 border-dashed p-4 flex flex-col items-center justify-center bg-white hover:bg-gray-50 hover:border-gray-400 transition h-32 relative overflow-hidden border-gray-300">
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
                  <Loader2 className="w-6 h-6 text-gray-700 animate-spin mb-1" />
                ) : (
                  <Upload className="w-6 h-6 text-gray-500 mb-1" />
                )}
                <p className="text-xs font-medium text-gray-700">
                  {isUploadingImage ? 'Uploading...' : 'Click to upload'}
                </p>
                <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
              </>
            )}
          </Card>
          <input
            type="file"
            className="hidden"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleImageSelect}
            disabled={disabled || isUploadingImage}
          />
        </label>
        {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
      </div>

      {/* Duration and Price Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Duration */}
        <div className="space-y-2">
          <Label htmlFor="duration" className="text-gray-900">Duration *</Label>
          <Select
            value={String(formData.duration_minutes)}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, duration_minutes: parseInt(value) }))
            }
            disabled={disabled}
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
          <Label htmlFor="price" className="text-gray-900">Base Price</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
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
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Branch */}
      {branches.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="branch" className="text-gray-900">Branch</Label>
          <Select
            value={formData.branch_id || 'all'}
            onValueChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                branch_id: value === 'all' ? null : value,
              }))
            }
            disabled={disabled}
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
        <Label htmlFor="is_active" className="text-gray-900">Active</Label>
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({ ...prev, is_active: checked }))
          }
          disabled={disabled}
        />
      </div>
    </div>
  );
}
