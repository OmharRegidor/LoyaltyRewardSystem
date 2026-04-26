// app/brand/[id].tsx — Brand detail screen

import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
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
const CARD_ASPECT = 1.586; // standard loyalty card proportions — fixed, never changes
const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT;

interface StampLoyaltyCardProps {
  stampCard: {
    stamps_collected: number;
    total_stamps: number;
    reward_title: string;
    is_completed: boolean;
    reward_image_url: string | null;
    milestones?: Array<{ position: number; label: string }>;
    redeemed_milestones?: Array<{ position: number }>;
    paused_at_milestone?: number | null;
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

  // Calculate grid layout: pick columns that create the most balanced grid
  const cols = (() => {
    const total = stampCard.total_stamps;
    if (total <= 3) return total;
    if (total <= 5) return 3;
    const maxCols = total <= 10 ? 5 : total <= 20 ? 7 : 10;
    const maxRows = 7;
    let best = maxCols;
    let bestScore = -Infinity;
    for (let c = 3; c <= maxCols; c++) {
      const r = Math.ceil(total / c);
      const empty = (c - (total % c)) % c;
      const rowPenalty = r > maxRows ? (r - maxRows) * 100 : 0;
      const score = -empty * 10 - r - rowPenalty;
      if (score > bestScore) { bestScore = score; best = c; }
    }
    return best;
  })();
  const rows = Math.ceil(stampCard.total_stamps / cols);

  // Stamps adapt to the fixed card size — card shape never changes.
  // Cells are square at min(availableWidthPerCell, availableHeightPerRow) so
  // the grid scales naturally with screen size: small phones get smaller
  // stamps, big phones get bigger ones, no awkward gaps in the middle.
  const cardPadding = 12;
  const gridGap = stampCard.total_stamps > 30 ? 3 : stampCard.total_stamps > 15 ? 4 : 5;
  const headerH = 24;
  const footerH = 20;
  const gridWidth = CARD_WIDTH - cardPadding * 2;
  const stampAreaH = CARD_HEIGHT - headerH - footerH - cardPadding * 2;
  const cellW = (gridWidth - (cols - 1) * gridGap) / cols;
  const cellH = (stampAreaH - (rows - 1) * gridGap) / rows;
  const cellSize = Math.floor(Math.min(cellW, cellH));
  const iconSize = Math.floor(cellSize * 0.45);

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
            {/* Header */}
            <View style={cardStyles.backHeader}>
              <Text style={cardStyles.backTitle}>
                {stampCard.stamps_collected}/{stampCard.total_stamps} stamps
              </Text>
            </View>

            {/* Stamp grid — fills card with square cells, centered both axes */}
            <View style={[cardStyles.stampGrid, { gap: gridGap }]}>
              {Array.from({ length: rows }, (_, row) => (
                <View
                  key={row}
                  style={{
                    flexDirection: 'row' as const,
                    gap: gridGap,
                    justifyContent: 'center',
                  }}
                >
                  {Array.from({ length: cols }, (__, col) => {
                    const i = row * cols + col;
                    if (i >= stampCard.total_stamps) return <View key={col} style={{ width: cellSize, height: cellSize }} />;
                    const position = i + 1;
                    const isFilled = i < stampCard.stamps_collected;
                    const isLast = i === stampCard.total_stamps - 1;
                    const milestone = stampCard.milestones?.find(m => m.position === position);
                    const isRedeemedMilestone = stampCard.redeemed_milestones?.some(r => r.position === position);
                    return (
                      <View
                        key={col}
                        style={[
                          cardStyles.stampSlot,
                          { width: cellSize, height: cellSize, borderRadius: 4 },
                          milestone && isFilled && isRedeemedMilestone && cardStyles.stampSlotMilestoneRedeemed,
                          milestone && isFilled && !isRedeemedMilestone && cardStyles.stampSlotMilestoneFilled,
                          milestone && !isFilled && cardStyles.stampSlotMilestone,
                          !milestone && isFilled && cardStyles.stampSlotFilled,
                          !milestone && isLast && !isFilled && cardStyles.stampSlotReward,
                        ]}
                      >
                        {milestone ? (
                          <Text style={[cardStyles.rewardSlotText, { fontSize: Math.max(6, iconSize * 0.35), color: isFilled ? '#fff' : '#B45309' }]}>
                            {milestone.label}
                          </Text>
                        ) : isLast && !isFilled ? (
                          <Text style={[cardStyles.rewardSlotText, { fontSize: Math.max(7, iconSize * 0.4) }]}>FREE</Text>
                        ) : (
                          <MaterialCommunityIcons
                            name="stamper"
                            size={iconSize}
                            color={isFilled ? '#fff' : COLORS.gray[300]}
                          />
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Footer */}
            <View style={cardStyles.backFooterRow}>
              {stampCard.reward_image_url && (
                <Image
                  source={{ uri: stampCard.reward_image_url }}
                  style={cardStyles.rewardImage}
                />
              )}
              <Text style={[cardStyles.backFooter, { flex: 1 }]} numberOfLines={1}>
                {stampCard.paused_at_milestone
                  ? `⭐ Show to staff: ${stampCard.milestones?.find(m => m.position === stampCard.paused_at_milestone)?.label ?? 'Milestone'}`
                  : stampCard.is_completed
                    ? `🎉 Reward ready: ${stampCard.reward_title}`
                    : `${stampCard.total_stamps - stampCard.stamps_collected} more → ${stampCard.reward_title}`}
              </Text>
            </View>
          </Animated.View>

          {/* FRONT — branding */}
          <Animated.View
            style={[
              cardStyles.card,
              cardStyles.cardFront,
              !stampCard.reward_image_url && { backgroundColor: COLORS.primary },
              {
                transform: [{ perspective: 1000 }, { rotateY: frontRotate }],
                opacity: frontOpacity,
              },
            ]}
          >
            {stampCard.reward_image_url ? (
              <ImageBackground
                source={{ uri: stampCard.reward_image_url }}
                style={cardStyles.frontBgImage}
                imageStyle={{ borderRadius: 16 }}
                resizeMode="cover"
              >
                <View style={cardStyles.frontOverlay}>
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
                </View>
              </ImageBackground>
            ) : (
              <>
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
              </>
            )}
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
    padding: 12,
  },
  cardBack: {
    backgroundColor: '#FFF9F0',
    borderWidth: 1,
    borderColor: '#F0E0CC',
  },
  cardFront: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 0,
  },
  frontBgImage: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
  },
  frontOverlay: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: SPACING.md,
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
    flex: 1,
    justifyContent: 'center',
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
  stampSlotMilestone: {
    backgroundColor: '#FFF8E1',
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
  },
  stampSlotMilestoneFilled: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  stampSlotMilestoneRedeemed: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  rewardSlotText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#E65100',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  backFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rewardImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  backFooter: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.gray[600],
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
        `Redeem "${reward.title}" for ${reward.points_cost.toLocaleString()} ${brand?.coin_name ?? 'pts'}?`,
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
                    {brand.points_per_purchase} {brand.coin_name ?? 'pts'} per purchase
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
                  You have {businessPoints.toLocaleString()} {brand.coin_name ?? 'pts'} at this store
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
