// src/components/home/BalanceCard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProgressBar } from '../ui/ProgressBar';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  getTier,
  getNextTier,
  getProgressToNextTier,
} from '../../lib/constants';

interface BalanceCardProps {
  points: number;
  lifetimePoints: number;
}

export function BalanceCard({ points, lifetimePoints }: BalanceCardProps) {
  const currentTier = getTier(lifetimePoints);
  const nextTier = getNextTier(lifetimePoints);
  const { progress, remaining } = getProgressToNextTier(lifetimePoints);

  return (
    <View style={styles.container}>
      {/* Points Display */}
      <View style={styles.pointsContainer}>
        <View style={styles.starIcon}>
          <Text style={styles.starEmoji}>⭐</Text>
        </View>
        <Text style={styles.pointsValue}>{points.toLocaleString()}</Text>
      </View>
      <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>

      {/* Tier Progress */}
      <View style={styles.tierContainer}>
        <ProgressBar
          progress={progress}
          height={8}
          backgroundColor="rgba(255,255,255,0.3)"
          fillColor={COLORS.success}
          label={`${currentTier.name} Member`}
          rightLabel={
            nextTier ? `${remaining} pts to ${nextTier.name}` : 'Max Tier!'
          }
          showLabel
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  starIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starEmoji: {
    fontSize: 16,
  },
  pointsValue: {
    fontSize: FONT_SIZE['4xl'],
    fontWeight: '700',
    color: COLORS.white,
  },
  balanceLabel: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginTop: SPACING.xs,
    fontWeight: '500',
  },
  tierContainer: {
    width: '100%',
    marginTop: SPACING.lg,
  },
});
