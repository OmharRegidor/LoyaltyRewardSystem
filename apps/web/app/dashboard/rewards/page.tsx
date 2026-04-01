// apps/web/app/dashboard/rewards/page.tsx

'use client';

import { DashboardLayout } from '@/components/dashboard/layout';
import { RewardsHeader } from '@/components/rewards/header';
import { RewardsGrid } from '@/components/rewards/grid';
import { CreateRewardModal } from '@/components/rewards/create-modal';
import { EditRewardModal } from '@/components/rewards/edit-modal';
import { ViewRewardModal } from '@/components/rewards/view-modal';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================
// TYPES
// ============================================

export type TierLevel = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Reward {
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
  tierRequired: TierLevel;
}

interface RewardFromDB {
  id: string;
  title: string;
  description: string | null;
  points_cost: number;
  stock: number | null;
  category: string | null;
  is_active: boolean | null;
  is_visible: boolean | null;
  image_url: string | null;
  created_at: string | null;
  valid_until: string | null;
  tier_required: string | null;
}

export interface CreateRewardData {
  title: string;
  description: string;
  pointsCost: number;
  stock: number;
  category: string;
  expiryDate?: string;
  image?: string;
  tierRequired: TierLevel;
}

export interface UpdateRewardData extends CreateRewardData {
  id: string;
  isVisible: boolean;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function RewardsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loyaltyMode, setLoyaltyMode] = useState<'points' | 'stamps'>('points');

  // ============================================
  // LOAD REWARDS FROM SUPABASE
  // ============================================

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: business } = await supabase
        .from('businesses')
        .select('id, loyalty_mode')
        .eq('owner_id', user.id)
        .single();

      if (!business) return;
      setBusinessId(business.id);
      setLoyaltyMode((business.loyalty_mode as 'points' | 'stamps') || 'points');

      const { data: rewardsData, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading rewards:', error);
        return;
      }

      const transformedRewards: Reward[] = (rewardsData || []).map(
        (r: RewardFromDB) => ({
          id: r.id,
          title: r.title,
          description: r.description || '',
          pointsCost: r.points_cost,
          stock: r.stock ?? 0,
          category: r.category || 'Food',
          status:
            r.is_active !== false &&
            r.is_visible !== false &&
            (r.stock === null || r.stock === -1 || r.stock > 0)
              ? 'active'
              : 'inactive',
          image: r.image_url || '/reward-item.png',
          isVisible: r.is_visible ?? true,
          expiryDate: r.valid_until || undefined,
          tierRequired: (r.tier_required as TierLevel) || 'bronze',
        }),
      );

      setRewards(transformedRewards);
    } catch (error) {
      console.error('Load rewards error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // GATED CREATE HANDLER
  // ============================================

  const handleCreateClick = () => {
    setIsCreateOpen(true);
  };

  // ============================================
  // CREATE REWARD
  // ============================================

  const handleCreateReward = async (newReward: CreateRewardData) => {
    if (!businessId) return;

    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('rewards')
        .insert({
          business_id: businessId,
          title: newReward.title,
          description: newReward.description,
          points_cost: newReward.pointsCost,
          stock: newReward.stock,
          category: newReward.category.toLowerCase(),
          image_url: newReward.image || null,
          is_active: true,
          is_visible: true,
          valid_until: newReward.expiryDate || null,
          tier_required: newReward.tierRequired,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating reward:', error);
        return;
      }

      const createdReward: Reward = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        pointsCost: data.points_cost,
        stock: data.stock ?? 0,
        category: newReward.category,
        status: 'active',
        image: data.image_url || '/reward-item.png',
        isVisible: true,
        expiryDate: data.valid_until || undefined,
        tierRequired: newReward.tierRequired,
      };

      setRewards(prev => [createdReward, ...prev]);
      setIsCreateOpen(false);
    } catch (error) {
      console.error('Create reward error:', error);
    }
  };

  // ============================================
  // UPDATE REWARD
  // ============================================

  const handleUpdateReward = async (updatedReward: UpdateRewardData) => {
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('rewards')
        .update({
          title: updatedReward.title,
          description: updatedReward.description,
          points_cost: updatedReward.pointsCost,
          stock: updatedReward.stock,
          category: updatedReward.category.toLowerCase(),
          image_url: updatedReward.image || null,
          is_visible: updatedReward.isVisible,
          valid_until: updatedReward.expiryDate || null,
          tier_required: updatedReward.tierRequired,
        })
        .eq('id', updatedReward.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating reward:', error);
        return;
      }

      setRewards(prev =>
        prev.map((r) =>
          r.id === updatedReward.id
            ? {
                ...r,
                title: data.title,
                description: data.description || '',
                pointsCost: data.points_cost,
                stock: data.stock ?? 0,
                category: updatedReward.category,
                image: data.image_url || '/reward-item.png',
                isVisible: data.is_visible ?? true,
                status:
                  data.is_visible &&
                  (data.stock === null || data.stock === -1 || data.stock > 0)
                    ? 'active'
                    : 'inactive',
                expiryDate: data.valid_until || undefined,
                tierRequired: updatedReward.tierRequired,
              }
            : r,
        ),
      );

      setIsEditOpen(false);
      setSelectedReward(null);
    } catch (error) {
      console.error('Update reward error:', error);
    }
  };

  // ============================================
  // DELETE REWARD
  // ============================================

  const handleDeleteReward = async (id: string) => {
    const supabase = createClient();

    try {
      const { error } = await supabase.from('rewards').delete().eq('id', id);

      if (error) {
        console.error('Error deleting reward:', error);
        return;
      }

      setRewards(prev => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error('Delete reward error:', error);
    }
  };

  // ============================================
  // TOGGLE VISIBILITY (Hide/Show)
  // ============================================

  const handleToggleStatus = async (id: string) => {
    const supabase = createClient();
    const reward = rewards.find((r) => r.id === id);
    if (!reward) return;

    const newIsVisible = !reward.isVisible;

    try {
      const { error } = await supabase
        .from('rewards')
        .update({ is_visible: newIsVisible })
        .eq('id', id);

      if (error) {
        console.error('Error toggling reward status:', error);
        return;
      }

      setRewards(prev =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                isVisible: newIsVisible,
                status: newIsVisible && r.stock !== 0 ? 'active' : 'inactive',
              }
            : r,
        ),
      );
    } catch (error) {
      console.error('Toggle status error:', error);
    }
  };

  // ============================================
  // VIEW & EDIT HANDLERS
  // ============================================

  const handleViewReward = (id: string) => {
    const reward = rewards.find((r) => r.id === id);
    if (reward) {
      setSelectedReward(reward);
      setIsViewOpen(true);
    }
  };

  const handleEditReward = (id: string) => {
    const reward = rewards.find((r) => r.id === id);
    if (reward) {
      setSelectedReward(reward);
      setIsEditOpen(true);
    }
  };

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Skeleton className="h-8 w-32 rounded-lg" />
              <Skeleton className="h-5 w-56 mt-1 rounded-lg" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-20 rounded-lg" />
              <Skeleton className="h-10 w-36 rounded-xl" />
            </div>
          </div>

          {/* Rewards grid skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
                <Skeleton className="h-36 w-full rounded-none" />
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32 rounded-lg" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-3/4 rounded-lg" />
                  <div className="flex items-center justify-between pt-1">
                    <Skeleton className="h-6 w-20 rounded-lg" />
                    <Skeleton className="h-4 w-16 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
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
        {loyaltyMode === 'stamps' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-amber-800 mb-2">
              Stamp Card Mode Active
            </h3>
            <p className="text-sm text-amber-700 mb-4">
              Your loyalty reward is configured as part of your stamp card in Settings.
              Customers earn stamps per visit and receive your configured reward when their card is complete.
            </p>
            <a
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-sm font-medium transition-colors"
            >
              Go to Settings →
            </a>
          </div>
        )}

        {loyaltyMode === 'points' && (
          <RewardsHeader
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onCreateClick={handleCreateClick}
          />
        )}

        {loyaltyMode === 'points' && (
          <RewardsGrid
            rewards={rewards}
            viewMode={viewMode}
            onDelete={handleDeleteReward}
            onToggleStatus={handleToggleStatus}
            onView={handleViewReward}
            onEdit={handleEditReward}
          />
        )}

        <CreateRewardModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreate={handleCreateReward}
        />

        {selectedReward && (
          <>
            <EditRewardModal
              isOpen={isEditOpen}
              onClose={() => {
                setIsEditOpen(false);
                setSelectedReward(null);
              }}
              onUpdate={handleUpdateReward}
              reward={selectedReward}
            />

            <ViewRewardModal
              isOpen={isViewOpen}
              onClose={() => {
                setIsViewOpen(false);
                setSelectedReward(null);
              }}
              reward={selectedReward}
              onEdit={() => {
                setIsViewOpen(false);
                setIsEditOpen(true);
              }}
            />
          </>
        )}

      </motion.div>
    </DashboardLayout>
  );
}
