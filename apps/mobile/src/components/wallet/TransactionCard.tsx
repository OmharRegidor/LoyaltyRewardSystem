// src/components/wallet/TransactionCard.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  SHADOWS,
} from '../../lib/constants';
import type { Transaction } from '../../types/wallet.types';

interface TransactionCardProps {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isToday) {
    return `Today at ${timeStr}`;
  } else if (isYesterday) {
    return `Yesterday at ${timeStr}`;
  } else {
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    return `${dateStr} at ${timeStr}`;
  }
}

export function TransactionCard({
  transaction,
  onPress,
}: TransactionCardProps) {
  const isCredit = transaction.type === 'credit';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(transaction)}
      activeOpacity={0.7}
    >
      {/* Icon Circle */}
      <View
        style={[
          styles.iconCircle,
          isCredit ? styles.iconCircleCredit : styles.iconCircleDebit,
        ]}
      >
        <Text
          style={[
            styles.iconText,
            isCredit ? styles.iconTextCredit : styles.iconTextDebit,
          ]}
        >
          {isCredit ? '+' : '−'}
        </Text>
      </View>

      {/* Text Content */}
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {transaction.title}
        </Text>
        <Text style={styles.timestamp}>
          {formatTime(transaction.created_at)}
        </Text>
      </View>

      {/* Points Badge */}
      <Text
        style={[
          styles.points,
          isCredit ? styles.pointsCredit : styles.pointsDebit,
        ]}
      >
        {isCredit ? '+' : '-'}
        {transaction.amount}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleCredit: {
    backgroundColor: '#E8FFF2',
  },
  iconCircleDebit: {
    backgroundColor: '#FFEFF0',
  },
  iconText: {
    fontSize: 22,
    fontWeight: '600',
  },
  iconTextCredit: {
    color: '#28C76F',
  },
  iconTextDebit: {
    color: '#FF3B30',
  },
  textContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  timestamp: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray[400],
    marginTop: 2,
  },
  points: {
    fontSize: FONT_SIZE.base,
    fontWeight: '700',
  },
  pointsCredit: {
    color: '#1EAD4E',
  },
  pointsDebit: {
    color: '#FF3B30',
  },
});
