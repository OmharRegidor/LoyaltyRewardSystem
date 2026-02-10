// src/components/brands/BranchCard.tsx

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
} from '../../lib/constants';
import type { BrandBranch } from '../../types/brands.types';

interface BranchCardProps {
  branch: BrandBranch;
}

function BranchCardComponent({ branch }: BranchCardProps) {
  const address = [branch.address, branch.city].filter(Boolean).join(', ');

  return (
    <View style={styles.card}>
      <Text style={styles.name}>{branch.name}</Text>

      {address ? (
        <View style={styles.row}>
          <Ionicons
            name="location-outline"
            size={14}
            color={COLORS.gray[400]}
          />
          <Text style={styles.text}>{address}</Text>
        </View>
      ) : null}

      {branch.phone ? (
        <View style={styles.row}>
          <Ionicons name="call-outline" size={14} color={COLORS.gray[400]} />
          <Text style={styles.text}>{branch.phone}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  name: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  text: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray[500],
    flex: 1,
  },
});

export const BranchCard = memo(BranchCardComponent);
