// src/components/wallet/RedemptionCard.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  SHADOWS,
} from '../../lib/constants';
import type { CustomerRedemption } from '../../types/wallet.types';

interface RedemptionCardProps {
  redemption: CustomerRedemption;
  onPress?: (redemption: CustomerRedemption) => void;
}

function getStatusConfig(status: CustomerRedemption['status']) {
  switch (status) {
    case 'pending':
      return {
        label: 'Active',
        bgColor: '#E8FFF2',
        textColor: '#28C76F',
      };
    case 'completed':
      return {
        label: 'Used',
        bgColor: '#F0F0F5',
        textColor: COLORS.gray[500],
      };
    case 'expired':
      return {
        label: 'Expired',
        bgColor: '#FFEFF0',
        textColor: '#FF3B30',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        bgColor: '#FFF3E8',
        textColor: '#F59E0B',
      };
    default:
      return {
        label: status,
        bgColor: COLORS.gray[100],
        textColor: COLORS.gray[500],
      };
  }
}

function getTimeRemaining(expiresAt: string): string | null {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) return null;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} left`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  } else {
    return `${minutes}m left`;
  }
}

export function RedemptionCard({ redemption, onPress }: RedemptionCardProps) {
  const statusConfig = getStatusConfig(redemption.status);
  const timeRemaining =
    redemption.status === 'pending'
      ? getTimeRemaining(redemption.expires_at)
      : null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(redemption)}
      activeOpacity={0.7}
    >
      {/* Reward Image */}
      <Image
        source={{
          uri:
            redemption.reward?.image_url ||
            'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200',
        }}
        style={styles.image}
      />

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {redemption.reward?.title || 'Reward'}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.bgColor },
            ]}
          >
            <Text
              style={[styles.statusText, { color: statusConfig.textColor }]}
            >
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <Text style={styles.businessName}>
          {redemption.business?.name || 'Business'}
        </Text>

        {/* Code or Time Remaining */}
        {redemption.status === 'pending' && (
          <View style={styles.codeRow}>
            <Text style={styles.codeLabel}>Code:</Text>
            <Text style={styles.codeValue}>{redemption.redemption_code}</Text>
          </View>
        )}

        {timeRemaining && (
          <View style={styles.timerRow}>
            <Text style={styles.timerIcon}>⏱️</Text>
            <Text style={styles.timerText}>{timeRemaining}</Text>
          </View>
        )}

        {redemption.status === 'completed' && redemption.completed_at && (
          <Text style={styles.usedDate}>
            Used on {new Date(redemption.completed_at).toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  image: {
    width: 90,
    height: 90,
    backgroundColor: COLORS.gray[200],
  },
  content: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.gray[900],
    flex: 1,
    marginRight: SPACING.sm,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  businessName: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  codeLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray[400],
    marginRight: 4,
  },
  codeValue: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: 'monospace',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  timerIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  timerText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
    color: COLORS.warning,
  },
  usedDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray[400],
    marginTop: SPACING.xs,
  },
});
