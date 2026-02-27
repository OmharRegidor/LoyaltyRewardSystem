// src/components/wallet/TransactionDetailModal.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
} from '../../lib/constants';
import type { Transaction, ReferenceType } from '../../types/wallet.types';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  visible: boolean;
  onClose: () => void;
}

const TYPE_LABELS: Record<ReferenceType, string> = {
  purchase: 'Purchase',
  redemption: 'Redemption',
  referral: 'Referral',
  bonus: 'Bonus',
  adjustment: 'Adjustment',
};

const TYPE_COLORS: Record<ReferenceType, { bg: string; text: string }> = {
  purchase: { bg: '#E8FFF2', text: '#1EAD4E' },
  redemption: { bg: '#FFEFF0', text: '#FF3B30' },
  referral: { bg: '#EEF0FF', text: '#5B6CFF' },
  bonus: { bg: '#FFF8E6', text: '#E5A100' },
  adjustment: { bg: '#F0F0F0', text: '#666666' },
};

function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatFullTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function TransactionDetailModal({
  transaction,
  visible,
  onClose,
}: TransactionDetailModalProps) {
  if (!transaction) return null;

  const isCredit = transaction.type === 'credit';
  const refType = transaction.reference_type ?? 'purchase';
  const typeColor = TYPE_COLORS[refType];
  const typeLabel = TYPE_LABELS[refType];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              {/* Handle bar */}
              <View style={styles.handle} />

              {/* Points hero */}
              <View style={styles.pointsHero}>
                <Text
                  style={[
                    styles.pointsText,
                    isCredit ? styles.pointsCredit : styles.pointsDebit,
                  ]}
                >
                  {isCredit ? '+' : '-'}{transaction.amount} pts
                </Text>
              </View>

              {/* Title */}
              <Text style={styles.title}>{transaction.title}</Text>

              {/* Business name */}
              {transaction.business?.name && (
                <Text style={styles.businessName}>
                  {transaction.business.name}
                </Text>
              )}

              {/* Type badge */}
              <View style={styles.badgeRow}>
                <View
                  style={[styles.badge, { backgroundColor: typeColor.bg }]}
                >
                  <Text style={[styles.badgeText, { color: typeColor.text }]}>
                    {typeLabel}
                  </Text>
                </View>
              </View>

              {/* Details */}
              <View style={styles.detailsContainer}>
                {transaction.description && (
                  <DetailRow label="Amount" value={transaction.description} />
                )}
                <DetailRow
                  label="Date"
                  value={formatFullDate(transaction.created_at)}
                />
                <DetailRow
                  label="Time"
                  value={formatFullTime(transaction.created_at)}
                />
              </View>

              {/* Close button */}
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gray[300],
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  pointsHero: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  pointsText: {
    fontSize: 32,
    fontWeight: '700',
  },
  pointsCredit: {
    color: '#1EAD4E',
  },
  pointsDebit: {
    color: '#FF3B30',
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.gray[900],
    textAlign: 'center',
  },
  businessName: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  badgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  detailsContainer: {
    backgroundColor: '#F6F7F9',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray[500],
  },
  detailValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: COLORS.gray[900],
  },
  closeButton: {
    backgroundColor: COLORS.gray[100],
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
});
