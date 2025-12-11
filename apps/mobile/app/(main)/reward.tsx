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
  } = useRewards();

  const [searchDebounce, setSearchDebounce] = useState('');

  // Debounced search
  const handleSearch = useCallback(
    (text: string) => {
      setSearchDebounce(text);
      const timer = setTimeout(() => {
        setSearchQuery(text);
      }, 300);
      return () => clearTimeout(timer);
    },
    [setSearchQuery]
  );

  // Handle redeem
  const handleRedeem = useCallback(
    async (reward: Reward) => {
      Alert.alert(
        'Redeem Reward',
        `Are you sure you want to redeem "${reward.title}" for ${reward.points_cost} points?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Redeem',
            onPress: async () => {
              try {
                const redemption = await redeemReward(reward);
                Alert.alert(
                  '🎉 Success!',
                  `Your redemption code is:\n\n${redemption.redemption_code}\n\nShow this to the cashier within 24 hours.`,
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
    [redeemReward]
  );

  // Render reward card
  const renderReward = useCallback(
    ({ item }: { item: Reward }) => (
      <RewardCard
        reward={item}
        userPoints={userPoints}
        onRedeem={handleRedeem}
        isRedeeming={redeemingId === item.id}
      />
    ),
    [userPoints, handleRedeem, redeemingId]
  );

  // Key extractor
  const keyExtractor = useCallback((item: Reward) => item.id, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Available Rewards</Text>
      </View>

      {/* Search Bar */}
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
          title={searchQuery ? 'No results found' : 'No Rewards Found'}
          subtitle={
            searchQuery
              ? `No rewards match "${searchQuery}"`
              : 'Try a different category or check back later'
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.base,
  },
  title: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
});
