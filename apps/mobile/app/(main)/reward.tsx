// app/(main)/rewards.tsx

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SearchBar,
  FilterTabs,
  RewardCard,
  RewardSkeletonList,
  EmptyState,
} from '../../src/components/rewards';
import { useRewards } from '../../src/hooks/useRewards';
import { COLORS, SPACING, FONT_SIZE } from '../../src/lib/constants';
import type { Reward } from '../../src/types/rewards.types';
import { getTierInfo } from '../../src/types/rewards.types';

export default function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const {
    rewards,
    isLoading,
    isRefreshing,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    refresh,
    redeemReward,
    redeemingId,
    userPoints,
    userTier,
    isLocked,
  } = useRewards();

  const [searchDebounce, setSearchDebounce] = useState('');

  // Debounced search
  const handleSearch = useCallback(
    (text: string) => {
      setSearchDebounce(text);
      const timer = setTimeout(() => setSearchQuery(text), 300);
      return () => clearTimeout(timer);
    },
    [setSearchQuery]
  );

  // Handle redeem
  const handleRedeem = useCallback(
    async (reward: Reward) => {
      // Check if locked
      if (isLocked(reward)) {
        const tierInfo = getTierInfo(reward.tier_required!);
        Alert.alert(
          '🔒 Tier Locked',
          `This reward requires ${tierInfo.emoji} ${tierInfo.name} membership.\n\nKeep earning points to unlock higher tiers!`,
          [{ text: 'Got it' }]
        );
        return;
      }

      Alert.alert(
        'Redeem Reward',
        `Redeem "${
          reward.title
        }" for ${reward.points_cost.toLocaleString()} points?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Redeem',
            onPress: async () => {
              try {
                const redemption = await redeemReward(reward);
                Alert.alert(
                  '🎉 Success!',
                  `Your code:\n\n${redemption.redemption_code}\n\nShow to cashier within 24 hours.`,
                  [{ text: 'OK' }]
                );
              } catch (error) {
                Alert.alert(
                  'Redemption Failed',
                  error instanceof Error
                    ? error.message
                    : 'Something went wrong'
                );
              }
            },
          },
        ]
      );
    },
    [redeemReward, isLocked]
  );

  // Render reward card
  const renderReward = useCallback(
    ({ item }: { item: Reward }) => (
      <RewardCard
        reward={item}
        userPoints={userPoints}
        userTier={userTier}
        onRedeem={handleRedeem}
        isRedeeming={redeemingId === item.id}
      />
    ),
    [userPoints, userTier, handleRedeem, redeemingId]
  );

  const keyExtractor = useCallback((item: Reward) => item.id, []);

  // Header with tier info
  const tierInfo = getTierInfo(userTier);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Available Rewards</Text>
        <View style={styles.tierIndicator}>
          <Text style={styles.tierEmoji}>{tierInfo.emoji}</Text>
          <Text style={[styles.tierName, { color: tierInfo.color }]}>
            {tierInfo.name}
          </Text>
        </View>
      </View>

      {/* Points Display */}
      <View style={styles.pointsBar}>
        <Text style={styles.pointsLabel}>Your Points</Text>
        <Text style={styles.pointsValue}>{userPoints.toLocaleString()}</Text>
      </View>

      {/* Search */}
      <SearchBar
        value={searchDebounce}
        onChangeText={handleSearch}
        placeholder="Search rewards..."
      />

      {/* Filter Tabs */}
      <FilterTabs
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Content */}
      {isLoading ? (
        <RewardSkeletonList count={3} />
      ) : rewards.length === 0 ? (
        <EmptyState
          title={searchQuery ? 'No results found' : 'No Rewards Available'}
          subtitle={
            searchQuery
              ? `No rewards match "${searchQuery}"`
              : 'Check back later for new rewards!'
          }
        />
      ) : (
        <FlatList
          data={rewards}
          renderItem={renderReward}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  tierIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tierEmoji: {
    fontSize: 14,
  },
  tierName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  pointsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
  },
  pointsLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray[600],
  },
  pointsValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.primary,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
});
