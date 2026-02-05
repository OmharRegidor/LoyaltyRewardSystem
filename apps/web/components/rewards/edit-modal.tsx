'use client';

import type React from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Upload, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  stock: number;
  category: string;
  image: string;
  isVisible: boolean;
  expiryDate?: string;
}

interface UpdateRewardData {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  stock: number;
  category: string;
  expiryDate?: string;
  image?: string;
  isVisible: boolean;
}

interface EditRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (reward: UpdateRewardData) => void | Promise<void>;
  reward: Reward;
}

export function EditRewardModal({
  isOpen,
  onClose,
  onUpdate,
  reward,
}: EditRewardModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pointsCost: '',
    stock: '',
    category: 'Food',
    expiryDate: '',
    image: '/reward-item.png',
    isVisible: true,
  });

  // Populate form when reward changes
  useEffect(() => {
    if (reward) {
      setFormData({
        title: reward.title,
        description: reward.description,
        pointsCost: reward.pointsCost.toString(),
        stock: reward.stock.toString(),
        category:
          reward.category.charAt(0).toUpperCase() + reward.category.slice(1),
        expiryDate: reward.expiryDate ? reward.expiryDate.split('T')[0] : '',
        image: reward.image || '/reward-item.png',
        isVisible: reward.isVisible,
      });
      // Set initial image preview from existing reward
      setImagePreview(reward.image || null);
      setUploadError(null);
    }
  }, [reward]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.pointsCost || !formData.stock) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onUpdate({
        id: reward.id,
        title: formData.title,
        description: formData.description,
        pointsCost: Number(formData.pointsCost),
        stock: Number(formData.stock),
        category: formData.category,
        expiryDate: formData.expiryDate || undefined,
        image: formData.image,
        isVisible: formData.isVisible,
      });
    } catch (error) {
      console.error('Error updating reward:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset error
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
      const fileName = `reward-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('reward-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('reward-images')
        .getPublicUrl(fileName);

      // Update form data with the uploaded URL
      setFormData((prev) => ({ ...prev, image: urlData.publicUrl }));
    } catch (error) {
      console.error('Image upload error:', error);
      setUploadError('Failed to upload image. Please try again.');
      // Revert to original image on error
      setImagePreview(reward.image || null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset image states
      setImagePreview(null);
      setUploadError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Reward</DialogTitle>
        </DialogHeader>

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left - Image Upload */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Reward Image</label>
              <label className="block cursor-pointer">
                <Card className="border-2 border-dashed p-6 flex flex-col items-center justify-center hover:bg-gray-50 hover:border-primary/50 transition h-48 relative overflow-hidden">
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="text-center text-white">
                          <Upload className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm font-medium">Change image</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {isUploadingImage ? (
                        <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                      ) : (
                        <Upload className="w-8 h-8 text-gray-500 mb-2" />
                      )}
                      <p className="text-sm font-medium">
                        {isUploadingImage ? 'Uploading...' : 'Click to upload'}
                      </p>
                      <p className="text-xs text-gray-500">
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

            {/* Right - Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Reward Title
                </label>
                <Input
                  placeholder="e.g., Free Coffee"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Description
                </label>
                <textarea
                  placeholder="Describe this reward..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Points Cost
                </label>
                <Input
                  type="number"
                  placeholder="e.g., 250"
                  min="1"
                  value={formData.pointsCost}
                  onChange={(e) =>
                    setFormData({ ...formData, pointsCost: e.target.value })
                  }
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Stock Quantity
                </label>
                <Input
                  type="number"
                  placeholder="e.g., 50 (-1 for unlimited)"
                  min="-1"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: e.target.value })
                  }
                  required
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter -1 for unlimited stock
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Category
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Food">Food</SelectItem>
                    <SelectItem value="Drinks">Drinks</SelectItem>
                    <SelectItem value="Discount">Discount</SelectItem>
                    <SelectItem value="Service">Service</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 dark:[&::-webkit-calendar-picker-indicator]:invert"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Visibility Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Visible to Customers</p>
                  <p className="text-xs text-gray-500">
                    Show this reward in the mobile app
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, isVisible: !formData.isVisible })
                  }
                  disabled={isSubmitting}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    formData.isVisible ? 'bg-primary' : 'bg-gray-100-foreground/30'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      formData.isVisible ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gradient-primary text-primary-foreground"
              type="submit"
              disabled={
                isSubmitting ||
                !formData.title ||
                !formData.pointsCost ||
                !formData.stock
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}
