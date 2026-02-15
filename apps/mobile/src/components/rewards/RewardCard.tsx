// src/components/rewards/RewardCard.tsx

import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  SHADOWS,
} from '../../lib/constants';
import type { Reward, TierLevel } from '../../types/rewards.types';
import { getTierInfo, canAccessReward } from '../../types/rewards.types';

// ============================================
// TYPES
// ============================================

interface RewardCardProps {
  reward: Reward;
  userPoints: number;
  userTier: TierLevel;
  onRedeem: (reward: Reward) => void;
  isRedeeming?: boolean;
}

// ============================================
// SUB-COMPONENTS
// ============================================

const TierBadge = memo(({ tier }: { tier: TierLevel }) => {
  const info = getTierInfo(tier);
  return (
    <View style={[styles.tierBadge, { backgroundColor: info.color + '20' }]}>
      <Text style={styles.tierEmoji}>{info.emoji}</Text>
      <Text style={[styles.tierText, { color: info.color }]}>{info.name}</Text>
    </View>
  );
});

const LockOverlay = memo(({ requiredTier }: { requiredTier: TierLevel }) => {
  const info = getTierInfo(requiredTier);
  return (
    <View style={styles.lockOverlay}>
      <View style={styles.lockContent}>
        <Ionicons name="lock-closed" size={32} color={COLORS.white} />
        <Text style={styles.lockText}>
          {info.emoji} {info.name} Required
        </Text>
      </View>
    </View>
  );
});

const StockBadge = memo(({ stock }: { stock: number }) => {
  if (stock === -1) return null; // Unlimited
  if (stock === 0) {
    return (
      <View style={[styles.stockBadge, styles.outOfStock]}>
        <Text style={styles.stockTextOut}>Out of Stock</Text>
      </View>
    );
  }
  if (stock <= 5) {
    return (
      <View style={[styles.stockBadge, styles.lowStock]}>
        <Text style={styles.stockTextLow}>Only {stock} left!</Text>
      </View>
    );
  }
  return (
    <View style={[styles.stockBadge, styles.inStock]}>
      <Text style={styles.stockTextIn}>{stock} left</Text>
    </View>
  );
});

// ============================================
// MAIN COMPONENT
// ============================================

function RewardCardComponent({
  reward,
  userPoints,
  userTier,
  onRedeem,
  isRedeeming = false,
}: RewardCardProps) {
  const isLocked = !canAccessReward(userTier, reward.tier_required);
  const hasEnoughPoints = userPoints >= reward.points_cost;
  const inStock = reward.stock === -1 || reward.stock > 0;
  const canRedeem = hasEnoughPoints && inStock && !isLocked;
  const pointsNeeded = Math.max(0, reward.points_cost - userPoints);

  return (
    <View style={[styles.card, isLocked && styles.cardLocked]}>
      {/* Image Section */}
      <View style={styles.imageContainer}>
        {reward.image_url ? (
          <Image
            source={{ uri: reward.image_url }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: COLORS.primary }]}>
            <Ionicons name="gift" size={40} color={COLORS.white} />
          </View>
        )}

        {/* Tier Badge (top-left) */}
        {reward.tier_required && (
          <View style={styles.tierBadgeContainer}>
            <TierBadge tier={reward.tier_required} />
          </View>
        )}

        {/* Stock Badge (top-right) */}
        <View style={styles.stockBadgeContainer}>
          <StockBadge stock={reward.stock} />
        </View>

        {/* Lock Overlay */}
        {isLocked && reward.tier_required && (
          <LockOverlay requiredTier={reward.tier_required} />
        )}
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        {/* Business Name & Location */}
        {reward.business && (
          <View style={styles.businessInfo}>
            <View style={styles.businessNameRow}>
              <Ionicons
                name="storefront-outline"
                size={12}
                color={COLORS.gray[500]}
              />
              <Text style={styles.businessName} numberOfLines={1}>
                {reward.business.name}
              </Text>
            </View>
            {reward.business.branches &&
              reward.business.branches.length > 0 && (
                <View style={styles.branchInfo}>
                  <Ionicons
                    name="location-outline"
                    size={12}
                    color={COLORS.gray[400]}
                  />
                  <Text style={styles.branchText} numberOfLines={1}>
                    {reward.business.branches.length === 1
                      ? `${reward.business.branches[0].address || reward.business.branches[0].name}${reward.business.branches[0].city ? `, ${reward.business.branches[0].city}` : ''}`
                      : `${reward.business.branches.length} locations`}
                  </Text>
                </View>
              )}
          </View>
        )}

        {/* Reward Title */}
        <Text style={styles.title} numberOfLines={2}>
          {reward.title}
        </Text>

        {/* Description */}
        {reward.description && (
          <Text style={styles.description} numberOfLines={2}>
            {reward.description}
          </Text>
        )}

        {/* Points & Action */}
        <View style={styles.footer}>
          <View style={styles.pointsContainer}>
            <Ionicons name="star" size={16} color={COLORS.gold} />
            <Text style={styles.pointsCost}>
              {reward.points_cost.toLocaleString()}
            </Text>
            <Text style={styles.pointsLabel}>pts</Text>
          </View>

          {isLocked ? (
            <View style={styles.lockedButton}>
              <Ionicons name="lock-closed" size={14} color={COLORS.gray[400]} />
              <Text style={styles.lockedButtonText}>Locked</Text>
            </View>
          ) : !hasEnoughPoints ? (
            <View style={styles.needMoreButton}>
              <Text style={styles.needMoreText}>
                Need {pointsNeeded.toLocaleString()} more
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.redeemButton,
                (!canRedeem || isRedeeming) && styles.redeemButtonDisabled,
              ]}
              onPress={() => onRedeem(reward)}
              disabled={!canRedeem || isRedeeming}
              activeOpacity={0.8}
            >
              {isRedeeming ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.redeemButtonText}>Redeem</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  businessInfo: {
    marginBottom: SPACING.xs,
  },
  businessNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  businessName: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray[600],
    fontWeight: '500',
    flex: 1,
  },
  branchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  branchText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray[400],
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  cardLocked: {
    opacity: 0.85,
  },
  imageContainer: {
    height: 140,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierBadgeContainer: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  tierEmoji: {
    fontSize: 12,
  },
  tierText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  stockBadgeContainer: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
  },
  stockBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  lowStock: {
    backgroundColor: COLORS.warning + '20',
  },
  outOfStock: {
    backgroundColor: COLORS.error + '20',
  },
  inStock: {
    backgroundColor: COLORS.success + '20',
  },
  stockTextLow: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.warning,
  },
  stockTextOut: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.error,
  },
  stockTextIn: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.success,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockContent: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  lockText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  content: {
    padding: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray[600],
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsCost: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  pointsLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray[500],
  },
  redeemButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 90,
    alignItems: 'center',
  },
  redeemButtonDisabled: {
    backgroundColor: COLORS.gray[300],
  },
  redeemButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  lockedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  lockedButtonText: {
    color: COLORS.gray[400],
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  needMoreButton: {
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  needMoreText: {
    color: COLORS.gray[500],
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
});

export const RewardCard = memo(RewardCardComponent);
