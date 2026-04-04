'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye, EyeOff, Coins, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  stock: number;
  category: string;
  status: 'active' | 'inactive';
  image: string;
  isVisible?: boolean;
}

interface RewardsGridProps {
  rewards: Reward[];
  viewMode: 'grid' | 'list';
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export function RewardsGrid({
  rewards,
  viewMode,
  onDelete,
  onToggleStatus,
  onView,
  onEdit,
}: RewardsGridProps) {
  const [deleteTarget, setDeleteTarget] = useState<Reward | null>(null);

  if (rewards.length === 0) {
    return (
      <Card className="p-12 text-center bg-gradient-to-b from-muted/30 to-background shadow-card border border-border/50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 mx-auto mb-4 flex items-center justify-center">
            <Coins className="w-7 h-7 text-primary/60" />
          </div>
          <h3 className="font-display font-semibold mb-2 text-foreground">Create Your First Reward</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Start building your rewards catalog
          </p>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
      }
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {rewards.map((reward, idx) => (
        <motion.div
          key={reward.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.05 }}
        >
          {viewMode === 'grid' ? (
            <RewardCard
              reward={reward}
              onDelete={() => setDeleteTarget(reward)}
              onToggleStatus={onToggleStatus}
              onView={onView}
              onEdit={onEdit}
            />
          ) : (
            <RewardListItem
              reward={reward}
              onDelete={() => setDeleteTarget(reward)}
              onToggleStatus={onToggleStatus}
              onView={onView}
              onEdit={onEdit}
            />
          )}
        </motion.div>
      ))}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="border-t-2 border-t-destructive">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Delete Reward</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">
                &ldquo;{deleteTarget?.title}&rdquo;
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => {
                if (deleteTarget) {
                  onDelete(deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

function RewardCard({
  reward,
  onDelete,
  onToggleStatus,
  onView,
  onEdit,
}: {
  reward: Reward;
  onDelete: () => void;
  onToggleStatus: (id: string) => void;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
}) {
  const isOutOfStock = reward.stock === 0;
  const isHidden = reward.isVisible === false;

  const getBadgeStatus = () => {
    if (isHidden)
      return { text: 'Hidden', dot: 'bg-muted-foreground', className: 'bg-muted text-muted-foreground' };
    if (isOutOfStock)
      return {
        text: 'Out of Stock',
        dot: 'bg-destructive',
        className: 'bg-destructive/10 text-destructive',
      };
    return { text: 'Active', dot: 'bg-emerald-500', className: 'bg-emerald-500/10 text-emerald-700' };
  };

  const badgeStatus = getBadgeStatus();

  return (
    <Card className="overflow-hidden shadow-card border border-border/50 hover:shadow-card-hover transition-shadow duration-300 group bg-background py-0 gap-0">
      {/* Image */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        <img
          src={reward.image || '/placeholder.svg'}
          alt={reward.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <Badge className={`${badgeStatus.className} gap-1.5`}>
            <span className={`w-1.5 h-1.5 rounded-full ${badgeStatus.dot}`} />
            {badgeStatus.text}
          </Badge>
        </div>
        {/* Gradient Overlay with View Details Button */}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
          <button
            onClick={() => onView?.(reward.id)}
            className="w-full bg-white text-foreground font-semibold py-2 rounded-xl hover:bg-white/90 transition-colors text-sm"
          >
            View Details
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-display font-bold line-clamp-2 text-foreground text-sm sm:text-base">{reward.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
            {reward.description}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-primary" />
            <span className="font-display text-lg font-bold tabular-nums tracking-tight text-foreground">{reward.pointsCost}</span>
          </div>
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {reward.stock === -1 ? 'Unlimited' : `${reward.stock} left`}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border/50">
          {/* Desktop: Inline buttons */}
          <div className="hidden md:flex gap-2 flex-1">
            <button
              onClick={() => onToggleStatus(reward.id)}
              className="flex-1 flex items-center justify-center gap-1 p-2 hover:bg-muted/50 rounded-lg transition-colors text-sm text-muted-foreground"
            >
              {reward.isVisible !== false ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Show
                </>
              )}
            </button>
            <button
              onClick={() => onEdit?.(reward.id)}
              className="flex-1 flex items-center justify-center gap-1 p-2 hover:bg-muted/50 rounded-lg transition-colors text-sm text-muted-foreground"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={onDelete}
              className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile: Dropdown menu */}
          <div className="md:hidden flex-1 flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 hover:bg-muted/50 rounded-lg transition-colors">
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onToggleStatus(reward.id)}>
                  {reward.isVisible !== false ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Show
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(reward.id)}>
                  <Edit className="w-4 h-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={onDelete}>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Card>
  );
}

function RewardListItem({
  reward,
  onDelete,
  onToggleStatus,
  onView,
  onEdit,
}: {
  reward: Reward;
  onDelete: () => void;
  onToggleStatus: (id: string) => void;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
}) {
  const isOutOfStock = reward.stock === 0;
  const isHidden = reward.isVisible === false;

  const getBadgeStatus = () => {
    if (isHidden)
      return { text: 'Hidden', dot: 'bg-muted-foreground', className: 'bg-muted text-muted-foreground' };
    if (isOutOfStock)
      return {
        text: 'Out',
        dot: 'bg-destructive',
        className: 'bg-destructive/10 text-destructive',
      };
    return { text: 'Active', dot: 'bg-emerald-500', className: 'bg-emerald-500/10 text-emerald-700' };
  };

  const badgeStatus = getBadgeStatus();

  return (
    <Card className="p-4 shadow-card border border-border/50 hover:shadow-card-hover transition-shadow duration-300 bg-background">
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div
          className="h-24 w-24 rounded-xl overflow-hidden shrink-0 bg-muted cursor-pointer"
          onClick={() => onView?.(reward.id)}
        >
          <img
            src={reward.image || '/placeholder.svg'}
            alt={reward.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h3
                className="font-display font-bold cursor-pointer hover:text-primary transition-colors text-foreground text-sm sm:text-base"
                onClick={() => onView?.(reward.id)}
              >
                {reward.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {reward.description}
              </p>
            </div>
            <Badge className={`${badgeStatus.className} gap-1.5`}>
              <span className={`w-1.5 h-1.5 rounded-full ${badgeStatus.dot}`} />
              {badgeStatus.text}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-primary" />
                <span className="font-display font-bold tabular-nums text-foreground">{reward.pointsCost}</span>
              </div>
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Stock: {reward.stock === -1 ? 'Unlimited' : reward.stock}
              </span>
            </div>

            <div className="flex gap-2">
              {/* Desktop: Inline buttons */}
              <div className="hidden md:flex gap-2">
                <button
                  onClick={() => onToggleStatus(reward.id)}
                  className="p-2 hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground"
                >
                  {reward.isVisible !== false ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => onEdit?.(reward.id)}
                  className="p-2 hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile: Dropdown menu */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 hover:bg-muted/50 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onToggleStatus(reward.id)}>
                      {reward.isVisible !== false ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Show
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit?.(reward.id)}>
                      <Edit className="w-4 h-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onClick={onDelete}>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
