// src/components/OfflineQRScreen.tsx

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useCustomer } from '../hooks/useCustomer';
import { useAuth } from '../hooks/useAuth';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  SHADOWS,
} from '../lib/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const QR_SIZE = SCREEN_WIDTH * 0.5;

export function OfflineQRScreen() {
  const insets = useSafeAreaInsets();
  const { customer, points, qrCodeUrl } = useCustomer();
  const { user } = useAuth();

  const customerName =
    user?.user_metadata?.full_name || user?.email || 'Customer';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      {/* Offline Banner */}
      <View style={styles.offlineBanner}>
        <Text style={styles.offlineDot}>●</Text>
        <Text style={styles.offlineText}>You're offline — QR code only</Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Earn Points</Text>
        <Text style={styles.subtitle}>
          Show this to the cashier to earn points
        </Text>
      </View>

      {/* QR Card */}
      <View style={styles.qrCard}>
        <View style={styles.qrContainer}>
          <QRCode
            value={qrCodeUrl || 'NoxaLoyalty://customer/default'}
            size={QR_SIZE}
            backgroundColor="white"
            color="#1F2937"
          />
        </View>

        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{customerName}</Text>
          <View style={styles.pointsRow}>
            <Text style={styles.pointsLabel}>Current Balance</Text>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsIcon}>⭐</Text>
              <Text style={styles.pointsValue}>
                {points.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  offlineDot: {
    color: '#FBBF24',
    fontSize: 10,
    marginRight: SPACING.xs,
  },
  offlineText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  qrCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  qrContainer: {
    padding: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
  },
  customerInfo: {
    marginTop: SPACING.base,
    alignItems: 'center',
    width: '100%',
  },
  customerName: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: SPACING.sm,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  pointsLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray[500],
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  pointsIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  pointsValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
});
