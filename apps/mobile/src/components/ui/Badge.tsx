// src/components/ui/Badge.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../lib/constants';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'tier';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  color?: string;
  textColor?: string;
}

export function Badge({
  children,
  variant = 'default',
  color,
  textColor,
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
    default: { bg: COLORS.gray[200], text: COLORS.gray[700] },
    success: { bg: COLORS.success + '20', text: COLORS.success },
    warning: { bg: COLORS.warning + '20', text: COLORS.warning },
    error: { bg: COLORS.error + '20', text: COLORS.error },
    tier: { bg: 'rgba(255,255,255,0.2)', text: COLORS.white },
  };

  const { bg, text } = variantStyles[variant];

  return (
    <View style={[styles.badge, { backgroundColor: color || bg }]}>
      <Text style={[styles.text, { color: textColor || text }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
});