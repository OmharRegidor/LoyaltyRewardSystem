// app/brand/[id].tsx — Brand detail screen

import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

const CARD_WIDTH = Dimensions.get('window').width - SPACING.lg * 2;
const CARD_ASPECT = 1.6; // credit-card ratio
const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT;

interface StampLoyaltyCardProps {
  stampCard: {
    stamps_collected: number;
    total_stamps: number;
    reward_title: string;
    is_completed: boolean;
  };
  brandName: string;
  brandLogoUrl: string | null;
}

function StampLoyaltyCard({ stampCard, brandName, brandLogoUrl }: StampLoyaltyCardProps) {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [isFlipped, setIsFlipped] = useState(false);

  const flipCard = () => {
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 1,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });
  const backRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [0, 0, 1, 1],
  });
  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [1, 1, 0, 0],
  });

  // Calculate grid layout: best fit for the card area
  const cols = stampCard.total_stamps <= 5 ? stampCard.total_stamps
    : stampCard.total_stamps <= 10 ? 5
    : stampCard.total_stamps <= 12 ? 4
    : 5;
  const rows = Math.ceil(stampCard.total_stamps / cols);
  const stampAreaH = CARD_HEIGHT - 72; // leave room for header + footer
  const stampSize = Math.min(
    Math.floor((CARD_WIDTH - 48 - (cols - 1) * 10) / cols),
    Math.floor((stampAreaH - (rows - 1) * 10) / rows),
    42,
  );

  return (
    <View style={cardStyles.section}>
      <View style={cardStyles.sectionHeader}>
        <Text style={cardStyles.sectionTitle}>Stamp Card</Text>
        <TouchableOpacity onPress={flipCard}>
          <Text style={cardStyles.flipHint}>
            {isFlipped ? 'View stamps' : 'View front'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity activeOpacity={0.9} onPress={flipCard}>
        <View style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}>
          {/* BACK — stamp grid (default visible) */}
          <Animated.View
            style={[
              cardStyles.card,
              cardStyles.cardBack,
              {
                transform: [{ perspective: 1000 }, { rotateY: backRotate }],
                opacity: backOpacity,
              },
            ]}
          >
            <View style={cardStyles.backHeader}>
              <Text style={cardStyles.backTitle}>
                {stampCard.stamps_collected}/{stampCard.total_stamps} stamps
              </Text>
            </View>
            <View style={cardStyles.stampGrid}>
              {Array.from({ length: stampCard.total_stamps }, (_, i) => {
                const isFilled = i < stampCard.stamps_collected;
                const isReward = i === stampCard.total_stamps - 1;
                return (
                  <View
                    key={i}
                    style={[
                      cardStyles.stampSlot,
                      { width: stampSize, height: stampSize, borderRadius: stampSize * 0.25 },
                      isFilled && cardStyles.stampSlotFilled,
                      isReward && !isFilled && cardStyles.stampSlotReward,
                    ]}
                  >
                    {isReward && !isFilled ? (
                      <Text style={cardStyles.rewardSlotText}>FREE</Text>
                    ) : (
                      <MaterialCommunityIcons
                        name="stamper"
                        size={stampSize * 0.45}
                        color={isFilled ? '#fff' : COLORS.gray[300]}
                      />
                    )}
                  </View>
                );
              })}
            </View>
            <Text style={cardStyles.backFooter} numberOfLines={1}>
              {stampCard.is_completed
                ? `🎉 Reward ready: ${stampCard.reward_title}`
                : `${stampCard.total_stamps - stampCard.stamps_collected} more → ${stampCard.reward_title}`}
            </Text>
          </Animated.View>

          {/* FRONT — branding */}
          <Animated.View
            style={[
              cardStyles.card,
              cardStyles.cardFront,
              {
                transform: [{ perspective: 1000 }, { rotateY: frontRotate }],
                opacity: frontOpacity,
              },
            ]}
          >
            {brandLogoUrl ? (
              <Image source={{ uri: brandLogoUrl }} style={cardStyles.frontLogo} />
            ) : (
              <View style={cardStyles.frontLogoFallback}>
                <Text style={cardStyles.frontLogoText}>
                  {brandName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={cardStyles.frontTitle}>LOYALTY CARD</Text>
            <Text style={cardStyles.frontBrand}>{brandName}</Text>
            <Text style={cardStyles.frontReward}>{stampCard.reward_title}</Text>
          </Animated.View>
        </View>
      </TouchableOpacity>

      <Text style={cardStyles.tapHint}>Tap card to flip</Text>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  section: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  flipHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    backfaceVisibility: 'hidden',
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  cardBack: {
    backgroundColor: '#FFF9F0',
    borderWidth: 1,
    borderColor: '#F0E0CC',
  },
  cardFront: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.gray[800],
  },
  stampGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingVertical: 4,
  },
  stampSlot: {
    backgroundColor: '#F5F0EB',
    borderWidth: 1.5,
    borderColor: '#E0D5C8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampSlotFilled: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stampSlotReward: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFB74D',
    borderStyle: 'dashed',
  },
  rewardSlotText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#E65100',
    letterSpacing: 0.5,
  },
  backFooter: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.gray[600],
    textAlign: 'center',
  },
  frontLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: SPACING.sm,
  },
  frontLogoFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  frontLogoText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  frontTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 3,
    marginBottom: 4,
  },
  frontBrand: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  frontReward: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: SPACING.xs,
  },
  tapHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray[400],
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});

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
    stampCard,
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
        `Redeem "${reward.title}" for ${reward.points_cost.toLocaleString()} ${brand?.coin_name?.toLowerCase() ?? 'pts'}?`,
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
    [redeemReward, isLocked, brand],
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

            {brand.loyalty_mode !== 'stamps' &&
              brand.points_per_purchase != null &&
              brand.points_per_purchase > 0 && (
                <View style={styles.rateBadge}>
                  {brand.coin_image_url ? (
                    <Image source={{ uri: brand.coin_image_url }} style={{ width: 14, height: 14, borderRadius: 7 }} />
                  ) : (
                    <Ionicons name="star" size={14} color={COLORS.gold} />
                  )}
                  <Text style={styles.rateText}>
                    {brand.points_per_purchase} {brand.coin_name?.toLowerCase() ?? 'pts'} per purchase
                  </Text>
                </View>
              )}

            {brand.description ? (
              <Text style={styles.description}>{brand.description}</Text>
            ) : null}

            {/* Per-business balance — stamps or points */}
            {brand.loyalty_mode === 'stamps' && stampCard ? (
              <View style={styles.stampBadge}>
                <Text style={styles.stampBadgeText}>
                  🎫 {stampCard.stamps_collected}/{stampCard.total_stamps} stamps
                  {stampCard.is_completed
                    ? ' — 🎉 Reward Ready!'
                    : ` — ${stampCard.total_stamps - stampCard.stamps_collected} more → ${stampCard.reward_title}`}
                </Text>
              </View>
            ) : brand.loyalty_mode === 'stamps' ? (
              <View style={styles.stampBadge}>
                <Text style={styles.stampBadgeText}>
                  🎫 Stamp card — visit to start collecting!
                </Text>
              </View>
            ) : (
              <View style={styles.pointsBadge}>
                <Ionicons
                  name="wallet-outline"
                  size={16}
                  color={COLORS.primary}
                />
                <Text style={styles.pointsBadgeText}>
                  You have {businessPoints.toLocaleString()} {brand.coin_name?.toLowerCase() ?? 'pts'} at this store
                </Text>
              </View>
            )}
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

        {/* Stamp Card (stamp mode) — flippable loyalty card */}
        {brand.loyalty_mode === 'stamps' && stampCard && (
          <StampLoyaltyCard
            stampCard={stampCard}
            brandName={brand.name}
            brandLogoUrl={brand.logo_url}
          />
        )}

        {/* Rewards (points mode only) */}
        {brand.loyalty_mode !== 'stamps' && (
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
                  userPoints={businessPoints}
                  userTier={userTier}
                  onRedeem={handleRedeem}
                  isRedeeming={redeemingId === reward.id}
                  coinName={brand.coin_name}
                  coinImageUrl={brand.coin_image_url}
                />
              ))
            )}
          </View>
        )}

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
    fontWeight: '600' as const,
    color: COLORS.primary,
  },
  stampBadge: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    marginTop: SPACING.sm,
  },
  stampBadgeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600' as const,
    color: '#F57F17',
    textAlign: 'center' as const,
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
