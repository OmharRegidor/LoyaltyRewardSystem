// src/components/rewards/PointBadge.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../lib/constants';

interface PointBadgeProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
}

export function PointBadge({ points, size = 'md' }: PointBadgeProps) {
  const sizeStyles = {
    sm: { paddingH: SPACING.sm, paddingV: 4, fontSize: FONT_SIZE.xs, iconSize: 10 },
    md: { paddingH: SPACING.md, paddingV: 6, fontSize: FONT_SIZE.sm, iconSize: 12 },
    lg: { paddingH: SPACING.base, paddingV: SPACING.sm, fontSize: FONT_SIZE.base, iconSize: 14 },
  };

  const currentSize = sizeStyles[size];

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: currentSize.paddingH,
          paddingVertical: currentSize.paddingV,
        },
      ]}
    >
      <Text style={[styles.star, { fontSize: currentSize.iconSize }]}>⭐</Text>
      <Text style={[styles.points, { fontSize: currentSize.fontSize }]}>
        {points.toLocaleString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning, // Gold/amber color
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  star: {
    color: COLORS.white,
  },
  points: {
    color: COLORS.white,
    fontWeight: '700',
  },
});