// src/components/rewards/RewardSkeleton.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../ui/Loading';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../lib/constants';

export function RewardSkeleton() {
  return (
    <View style={styles.card}>
      {/* Image Skeleton */}
      <Skeleton width="100%" height={140} borderRadius={0} />

      {/* Content Skeleton */}
      <View style={styles.content}>
        <Skeleton width={100} height={14} />
        <Skeleton width="80%" height={20} style={{ marginTop: SPACING.sm }} />
        <Skeleton width="100%" height={16} style={{ marginTop: SPACING.sm }} />
        <Skeleton width="60%" height={16} style={{ marginTop: 4 }} />
        <Skeleton width={80} height={14} style={{ marginTop: SPACING.sm }} />
        <Skeleton
          width="100%"
          height={44}
          style={{ marginTop: SPACING.md }}
          borderRadius={BORDER_RADIUS.md}
        />
      </View>
    </View>
  );
}

export function RewardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <RewardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.base,
    ...SHADOWS.md,
  },
  content: {
    padding: SPACING.base,
  },
});
