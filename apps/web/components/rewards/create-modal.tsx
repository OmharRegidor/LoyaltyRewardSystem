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
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreateRewardData {
  title: string;
  description: string;
  pointsCost: number;
  stock: number;
  category: string;
  expiryDate?: string;
  image?: string;
}

interface CreateRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (reward: CreateRewardData) => void | Promise<void>;
}

export function CreateRewardModal({
  isOpen,
  onClose,
  onCreate,
}: CreateRewardModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pointsCost: '',
    stock: '',
    category: 'Food',
    expiryDate: '',
    image: '/reward-item.png',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.pointsCost || !formData.stock) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onCreate({
        title: formData.title,
        description: formData.description,
        pointsCost: Number(formData.pointsCost),
        stock: Number(formData.stock),
        category: formData.category,
        expiryDate: formData.expiryDate || undefined,
        image: formData.image,
      });

      // Reset form after successful creation
      setFormData({
        title: '',
        description: '',
        pointsCost: '',
        stock: '',
        category: 'Food',
        expiryDate: '',
        image: '/reward-item.png',
      });
    } catch (error) {
      console.error('Error creating reward:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Reward</DialogTitle>
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
              <Card className="border-2 border-dashed p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition h-48">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Upload image</p>
                <p className="text-xs text-muted-foreground">
                  or drag and drop
                </p>
                <input type="file" className="hidden" accept="image/*" />
              </Card>
              <div className="h-24 rounded-lg bg-muted overflow-hidden">
                <img
                  src={formData.image || '/placeholder.svg'}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
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
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50"
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
                <p className="text-xs text-muted-foreground mt-1">
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
                <Input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-6 border-t border-border">
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
                'Save Reward'
              )}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}
