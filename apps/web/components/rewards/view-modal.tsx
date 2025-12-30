'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Coins, Calendar, Package, Eye, EyeOff, Edit } from 'lucide-react';

interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  stock: number;
  category: string;
  status: 'active' | 'inactive';
  image: string;
  isVisible: boolean;
  expiryDate?: string;
}

interface ViewRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: Reward;
  onEdit: () => void;
}

export function ViewRewardModal({
  isOpen,
  onClose,
  reward,
  onEdit,
}: ViewRewardModalProps) {
  const isOutOfStock = reward.stock === 0;
  const isHidden = reward.isVisible === false;

  const getBadgeStatus = () => {
    if (isHidden)
      return { text: 'HIDDEN', className: 'bg-muted text-muted-foreground' };
    if (isOutOfStock)
      return {
        text: 'OUT OF STOCK',
        className: 'bg-destructive text-destructive-foreground',
      };
    return { text: 'ACTIVE', className: 'bg-success text-success-foreground' };
  };

  const badgeStatus = getBadgeStatus();

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No expiry';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Reward Details</DialogTitle>
        </DialogHeader>

        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Image */}
          <div className="relative h-48 bg-muted rounded-xl overflow-hidden">
            <img
              src={reward.image || '/placeholder.svg'}
              alt={reward.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3">
              <Badge className={badgeStatus.className}>
                {badgeStatus.text}
              </Badge>
            </div>
          </div>

          {/* Title & Description */}
          <div>
            <h2 className="text-2xl font-bold mb-2">{reward.title}</h2>
            <p className="text-muted-foreground">{reward.description}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Points Cost */}
            <div className="p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Coins className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Points Cost
                </span>
              </div>
              <p className="text-2xl font-bold">{reward.pointsCost}</p>
            </div>

            {/* Stock */}
            <div className="p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Stock</span>
              </div>
              <p className="text-2xl font-bold">
                {reward.stock === -1 ? 'Unlimited' : reward.stock}
              </p>
            </div>

            {/* Category */}
            <div className="p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-muted-foreground">Category</span>
              </div>
              <p className="text-lg font-semibold capitalize">
                {reward.category}
              </p>
            </div>

            {/* Expiry */}
            <div className="p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Expires</span>
              </div>
              <p className="text-lg font-semibold">
                {formatDate(reward.expiryDate)}
              </p>
            </div>
          </div>

          {/* Visibility Status */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="flex items-center gap-3">
              {reward.isVisible ? (
                <Eye className="w-5 h-5 text-success" />
              ) : (
                <EyeOff className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">
                  {reward.isVisible
                    ? 'Visible to Customers'
                    : 'Hidden from Customers'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {reward.isVisible
                    ? 'This reward is shown in the mobile app'
                    : 'This reward is not visible in the mobile app'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              className="flex-1 gradient-primary text-primary-foreground gap-2"
              onClick={onEdit}
            >
              <Edit className="w-4 h-4" />
              Edit Reward
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
