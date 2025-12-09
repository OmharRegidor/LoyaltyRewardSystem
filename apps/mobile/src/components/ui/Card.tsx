// src/components/ui/Card.tsx

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../lib/constants';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof SPACING;
  shadow?: 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  style,
  padding = 'lg',
  shadow = 'md',
}: CardProps) {
  return (
    <View
      style={[
        styles.card,
        { padding: SPACING[padding] },
        SHADOWS[shadow],
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
  },
});