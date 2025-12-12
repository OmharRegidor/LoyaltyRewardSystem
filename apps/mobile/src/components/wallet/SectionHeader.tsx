// src/components/wallet/SectionHeader.tsx

import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZE } from '../../lib/constants';

interface SectionHeaderProps {
  title: string;
}

export function SectionHeader({ title }: SectionHeaderProps) {
  return <Text style={styles.header}>{title}</Text>;
}

const styles = StyleSheet.create({
  header: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray[500],
    letterSpacing: 0.5,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
});
