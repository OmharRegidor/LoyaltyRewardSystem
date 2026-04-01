// src/components/home/StampCardWidget.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../lib/constants';
import type { StampCard } from '../../types/stamp.types';

interface StampCardWidgetProps {
  stampCard: StampCard;
  onPress?: () => void;
}

export function StampCardWidget({ stampCard, onPress }: StampCardWidgetProps) {
  const {
    stamps_collected,
    total_stamps,
    reward_title,
    is_completed,
    business_name,
    business_logo_url,
  } = stampCard;

  const progress = total_stamps > 0 ? stamps_collected / total_stamps : 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Logo */}
      <View style={styles.logoRow}>
        {business_logo_url ? (
          <Image source={{ uri: business_logo_url }} style={styles.logo} />
        ) : (
          <View style={styles.logoFallback}>
            <Text style={styles.logoFallbackText}>
              {business_name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Business name */}
      <Text style={styles.businessName} numberOfLines={1}>
        {business_name}
      </Text>

      {/* Stamp count */}
      <Text style={[styles.count, is_completed && styles.countComplete]}>
        {stamps_collected}/{total_stamps}
      </Text>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%` },
            is_completed && styles.progressComplete,
          ]}
        />
      </View>

      {/* Reward text */}
      <Text style={[styles.reward, is_completed && styles.rewardComplete]} numberOfLines={1}>
        {is_completed ? 'Reward ready!' : reward_title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    width: 160,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
    alignItems: 'center',
  },
  logoRow: {
    marginBottom: SPACING.xs,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  logoFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFallbackText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  businessName: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.gray[900],
    textAlign: 'center',
    marginBottom: 6,
  },
  count: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '800' as const,
    color: COLORS.primary,
    marginBottom: 4,
  },
  countComplete: {
    color: '#2E7D32',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.gray[100],
    borderRadius: 2,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressComplete: {
    backgroundColor: '#2E7D32',
  },
  reward: {
    fontSize: 10,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
  rewardComplete: {
    color: '#2E7D32',
    fontWeight: '600' as const,
  },
});
