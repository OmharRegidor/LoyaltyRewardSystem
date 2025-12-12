// src/components/wallet/EmptyWallet.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZE } from '../../lib/constants';

interface EmptyWalletProps {
  type: 'transactions' | 'rewards';
}

export function EmptyWallet({ type }: EmptyWalletProps) {
  const isTransactions = type === 'transactions';

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{isTransactions ? '📋' : '🎁'}</Text>
      <Text style={styles.title}>
        {isTransactions ? 'No Transactions Yet' : 'No Rewards Yet'}
      </Text>
      <Text style={styles.subtitle}>
        {isTransactions
          ? 'Start earning points by scanning your QR code at partner stores'
          : 'Redeem rewards from the Rewards tab to see them here'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl * 2,
    paddingVertical: SPACING.xl * 3,
  },
  emoji: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 20,
  },
});
