// src/components/brands/BrandCard.tsx

import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  SHADOWS,
} from '../../lib/constants';
import type { Brand } from '../../types/brands.types';

interface BrandCardProps {
  brand: Brand;
  onPress: (brand: Brand) => void;
}

function BrandCardComponent({ brand, onPress }: BrandCardProps) {
  const initial = brand.name.charAt(0).toUpperCase();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(brand)}
      activeOpacity={0.7}
    >
      {/* Logo */}
      {brand.logo_url ? (
        <Image source={{ uri: brand.logo_url }} style={styles.logo} />
      ) : (
        <View style={[styles.logo, styles.logoFallback]}>
          <Text style={styles.logoInitial}>{initial}</Text>
        </View>
      )}

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {brand.name}
        </Text>

        <View style={styles.metaRow}>
          <Ionicons
            name="location-outline"
            size={13}
            color={COLORS.gray[400]}
          />
          <Text style={styles.metaText}>
            {brand.branches.length}{' '}
            {brand.branches.length === 1 ? 'branch' : 'branches'}
          </Text>
        </View>

        {brand.points_per_purchase != null && brand.points_per_purchase > 0 && (
          <View style={styles.metaRow}>
            <Ionicons name="star" size={13} color={COLORS.gold} />
            <Text style={styles.metaText}>
              {brand.points_per_purchase} pts per purchase
            </Text>
          </View>
        )}
      </View>

      {/* Chevron */}
      <Ionicons
        name="chevron-forward"
        size={20}
        color={COLORS.gray[300]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
  },
  logoFallback: {
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitial: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '700',
    color: COLORS.primary,
  },
  info: {
    flex: 1,
    marginLeft: SPACING.md,
    marginRight: SPACING.sm,
  },
  name: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray[500],
  },
});

export const BrandCard = memo(BrandCardComponent);
