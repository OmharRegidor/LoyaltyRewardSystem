// app/brand/[id].tsx — Brand detail screen

import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FullScreenLoading } from '../../src/components/ui/Loading';
import { RewardCard, EmptyState } from '../../src/components/rewards';
import { BranchCard } from '../../src/components/brands';
import { useBrandRewards } from '../../src/hooks/useBrandRewards';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  SHADOWS,
} from '../../src/lib/constants';
import type { Reward } from '../../src/types/rewards.types';
import { getTierInfo } from '../../src/types/rewards.types';

export default function BrandDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    brand,
    rewards,
    isLoading,
    isRefreshing,
    redeemReward,
    redeemingId,
    isLocked,
    userPoints,
    businessPoints,
    userTier,
    refresh,
  } = useBrandRewards(id);

  const handleRedeem = useCallback(
    async (reward: Reward) => {
      if (isLocked(reward)) {
        const tierInfo = getTierInfo(reward.tier_required!);
        Alert.alert(
          'Tier Locked',
          `This reward requires ${tierInfo.emoji} ${tierInfo.name} membership.\n\nKeep earning points to unlock higher tiers!`,
          [{ text: 'Got it' }],
        );
        return;
      }

      Alert.alert(
        'Redeem Reward',
        `Redeem "${reward.title}" for ${reward.points_cost.toLocaleString()} points?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Redeem',
            onPress: async () => {
              try {
                const redemption = await redeemReward(reward);
                Alert.alert(
                  'Success!',
                  `Your code:\n\n${redemption.redemption_code}\n\nShow to cashier within 24 hours.`,
                  [{ text: 'OK' }],
                );
              } catch (error) {
                Alert.alert(
                  'Redemption Failed',
                  error instanceof Error
                    ? error.message
                    : 'Something went wrong',
                );
              }
            },
          },
        ],
      );
    },
    [redeemReward, isLocked],
  );

  if (isLoading) {
    return <FullScreenLoading />;
  }

  if (!brand) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.gray[900]} />
        </TouchableOpacity>
        <EmptyState
          title="Brand not found"
          subtitle="This brand may no longer be available."
        />
      </View>
    );
  }

  const initial = brand.name.charAt(0).toUpperCase();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.gray[900]} />
          </TouchableOpacity>

          <View style={styles.brandHeader}>
            {brand.logo_url ? (
              <Image source={{ uri: brand.logo_url }} style={styles.logo} />
            ) : (
              <View style={[styles.logo, styles.logoFallback]}>
                <Text style={styles.logoInitial}>{initial}</Text>
              </View>
            )}

            <Text style={styles.brandName}>{brand.name}</Text>

            {brand.points_per_purchase != null &&
              brand.points_per_purchase > 0 && (
                <View style={styles.rateBadge}>
                  <Ionicons name="star" size={14} color={COLORS.gold} />
                  <Text style={styles.rateText}>
                    {brand.points_per_purchase} pts per purchase
                  </Text>
                </View>
              )}

            {brand.description ? (
              <Text style={styles.description}>{brand.description}</Text>
            ) : null}

            {/* Per-business points balance */}
            <View style={styles.pointsBadge}>
              <Ionicons name="wallet-outline" size={16} color={COLORS.primary} />
              <Text style={styles.pointsBadgeText}>
                You have {businessPoints.toLocaleString()} pts at this store
              </Text>
            </View>
          </View>
        </View>

        {/* Branches */}
        {brand.branches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Branches</Text>
              <Text style={styles.sectionCount}>{brand.branches.length}</Text>
            </View>
            {brand.branches.map((branch) => (
              <BranchCard key={branch.id} branch={branch} />
            ))}
          </View>
        )}

        {/* Rewards */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rewards</Text>
            <Text style={styles.sectionCount}>{rewards.length}</Text>
          </View>

          {rewards.length === 0 ? (
            <EmptyState
              title="No rewards"
              subtitle="This brand has no rewards available."
            />
          ) : (
            rewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                userPoints={userPoints}
                userTier={userTier}
                onRedeem={handleRedeem}
                isRedeeming={redeemingId === reward.id}
              />
            ))
          )}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: SPACING['2xl'] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  header: {
    paddingHorizontal: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    ...SHADOWS.sm,
  },
  brandHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.md,
  },
  logoFallback: {
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitial: {
    fontSize: FONT_SIZE['3xl'],
    fontWeight: '700',
    color: COLORS.primary,
  },
  brandName: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '700',
    color: COLORS.gray[900],
    textAlign: 'center',
  },
  rateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.gold + '15',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    marginTop: SPACING.sm,
  },
  rateText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  description: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 20,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    marginTop: SPACING.sm,
  },
  pointsBadgeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  sectionCount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.gray[400],
  },
});
