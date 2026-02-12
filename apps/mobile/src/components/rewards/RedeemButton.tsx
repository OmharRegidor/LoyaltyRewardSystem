// src/components/rewards/RedeemButton.tsx

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';

import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../lib/constants';

interface RedeemButtonProps {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  pointsNeeded?: number;
}

export function RedeemButton({
  onPress,
  disabled = false,
  loading = false,
  pointsNeeded = 0,
}: RedeemButtonProps) {
  const isDisabled = disabled || loading || pointsNeeded > 0;

  if (isDisabled && !loading) {
    return (
      <View style={[styles.button, styles.buttonDisabled]}>
        <Text style={[styles.text, styles.textDisabled]}>
          {pointsNeeded > 0 ? `Need ${pointsNeeded} more points` : 'Unavailable'}
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      <View style={[styles.button, styles.buttonEnabled, { backgroundColor: COLORS.primary }]}>
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <Text style={styles.text}>Redeem Now</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 44,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
  buttonEnabled: {
    shadowColor: '#7F0404',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray[100],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  text: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.white,
  },
  textDisabled: {
    color: COLORS.gray[500],
  },
});