// src/components/brands/BrandSkeleton.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../ui/Loading';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from '../../lib/constants';

function BrandSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width={64} height={64} borderRadius={BORDER_RADIUS.lg} />
      <View style={styles.info}>
        <Skeleton width="70%" height={16} borderRadius={4} />
        <Skeleton
          width="50%"
          height={12}
          borderRadius={4}
          style={{ marginTop: 8 }}
        />
        <Skeleton
          width="40%"
          height={12}
          borderRadius={4}
          style={{ marginTop: 6 }}
        />
      </View>
    </View>
  );
}

export function BrandSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <BrandSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.base,
    ...SHADOWS.md,
  },
  info: {
    flex: 1,
    marginLeft: SPACING.base,
  },
  list: {
    paddingHorizontal: SPACING.lg,
  },
});
