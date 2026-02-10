// src/components/home/RedeemableRewards.tsx

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRewards } from '../../hooks/useRewards';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  SHADOWS,
} from '../../lib/constants';

const CARD_WIDTH = 160;
const CARD_GAP = 12;

export function RedeemableRewards() {
  const router = useRouter();
  const { allRewards, canRedeem, isLoading } = useRewards();

  const redeemable = useMemo(
    () => allRewards.filter((r) => canRedeem(r)),
    [allRewards, canRedeem],
  );

  if (isLoading || redeemable.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rewards You Can Redeem</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
      >
        {redeemable.map((reward) => (
          <TouchableOpacity
            key={reward.id}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/brand/[id]', params: { id: reward.business_id } })}
          >
            {/* Business logo or initial */}
            <View style={styles.logoContainer}>
              {reward.business?.logo_url ? (
                <Image
                  source={{ uri: reward.business.logo_url }}
                  style={styles.logo}
                />
              ) : (
                <View style={styles.logoFallback}>
                  <Text style={styles.logoInitial}>
                    {reward.business?.name?.charAt(0) ?? '?'}
                  </Text>
                </View>
              )}
            </View>

            {/* Reward title */}
            <Text style={styles.rewardTitle} numberOfLines={1}>
              {reward.title}
            </Text>

            {/* Business name */}
            <Text style={styles.businessName} numberOfLines={1}>
              {reward.business?.name ?? 'Unknown'}
            </Text>

            {/* Points badge */}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {reward.points_cost.toLocaleString()} pts
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.gray[900],
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.base,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.base,
    marginRight: CARD_GAP,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  logo: {
    width: 48,
    height: 48,
  },
  logoFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitial: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.white,
  },
  rewardTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.gray[900],
    textAlign: 'center',
    width: '100%',
  },
  businessName: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginTop: 2,
    width: '100%',
  },
  badge: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  badgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
