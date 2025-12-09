// src/components/home/MemberQRCard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Loading';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../lib/constants';

interface MemberQRCardProps {
  qrCodeUrl: string | null;
  isLoading?: boolean;
}

export function MemberQRCard({ qrCodeUrl, isLoading }: MemberQRCardProps) {
  return (
    <Card style={styles.card} padding="lg" shadow="lg">
      <Text style={styles.title}>Your Member Code</Text>
      <Text style={styles.subtitle}>Show this to cashier to earn points</Text>

      <View style={styles.qrContainer}>
        {isLoading || !qrCodeUrl ? (
          <View style={styles.qrPlaceholder}>
            <Skeleton width={160} height={160} borderRadius={BORDER_RADIUS.lg} />
          </View>
        ) : (
          <View style={styles.qrWrapper}>
            <QRCode
              value={qrCodeUrl}
              size={160}
              backgroundColor={COLORS.white}
              color={COLORS.primary}
              logo={undefined}
            />
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.lg,
    marginTop: -SPACING['2xl'], // Overlap with gradient header
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.gray[900],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  qrContainer: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  qrWrapper: {
    padding: SPACING.base,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.gray[100],
  },
  qrPlaceholder: {
    padding: SPACING.base,
  },
});