// src/components/rewards/RewardCard.tsx

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PointBadge } from './PointBadge';
import { StockBadge } from './StockBadge';
import { RedeemButton } from './RedeemButton';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../lib/constants';
import type { Reward } from '../../types/rewards.types';

interface RewardCardProps {
  reward: Reward;
  userPoints: number;
  onRedeem: (reward: Reward) => void;
  isRedeeming: boolean;
}

export function RewardCard({
  reward,
  userPoints,
  onRedeem,
  isRedeeming,
}: RewardCardProps) {
  const pointsNeeded = Math.max(0, reward.points_cost - userPoints);
  const canRedeem = pointsNeeded === 0 && reward.stock > 0;
  const isLowStock = reward.stock <= 5 && reward.stock > 0;

  return (
    <View style={styles.card}>
      {/* Image Section with Title Overlay */}
      <ImageBackground
        source={{
          uri: reward.image_url || 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop',
        }}
        style={styles.imageContainer}
        imageStyle={styles.image}
      >
        {/* Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.imageGradient}
        >
          {/* Title on Image */}
          <Text style={styles.titleOnImage}>{reward.title}</Text>
        </LinearGradient>

        {/* Point Badge Overlay */}
        <View style={styles.badgeOverlay}>
          <PointBadge points={reward.points_cost} />
        </View>
      </ImageBackground>

      {/* Content Section */}
      <View style={styles.content}>
        {/* Business Name */}
        {reward.business && (
          <Text style={styles.businessName}>{reward.business.name}</Text>
        )}

        {/* Description */}
        {reward.description && (
          <Text style={styles.description} numberOfLines={2}>
            {reward.description}
          </Text>
        )}

        {/* Stock Badge */}
        <StockBadge stock={reward.stock} />

        {/* Points Requirement - Only show if can't afford */}
        {pointsNeeded > 0 && (
          <View style={styles.requirementContainer}>
            <Text style={styles.requirementText}>
              Need {pointsNeeded} more points
            </Text>
          </View>
        )}

        {/* Redeem Button */}
        <RedeemButton
          onPress={() => onRedeem(reward)}
          disabled={!canRedeem}
          loading={isRedeeming}
          pointsNeeded={pointsNeeded}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.base,
    ...SHADOWS.md,
  },
  imageContainer: {
    height: 160,
    width: '100%',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  image: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
  },
  titleOnImage: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  badgeOverlay: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
  },
  content: {
    padding: SPACING.base,
  },
  businessName: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray[500],
    lineHeight: 20,
  },
  requirementContainer: {
    marginTop: SPACING.sm,
    alignItems: 'center',
  },
  requirementText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.error,
    fontWeight: '500',
  },
});