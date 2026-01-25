// src/components/home/QuickQRModal.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  SHADOWS,
} from '../../lib/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const QR_SIZE = SCREEN_WIDTH * 0.5; // Reduced from 0.6

interface QuickQRModalProps {
  visible: boolean;
  onClose: () => void;
  qrCodeUrl: string;
  customerName: string;
  points: number;
}

export function QuickQRModal({
  visible,
  onClose,
  qrCodeUrl,
  customerName,
  points,
}: QuickQRModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6', '#A855F7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.container, { paddingTop: insets.top + 10 }]}
        >
          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeButton, { top: insets.top + 10 }]}
            activeOpacity={0.7}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
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

              {/* Customer Info */}
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

            {/* Instructions */}
            <View style={styles.instructions}>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>1</Text>
                </View>
                <Text style={styles.instructionText}>
                  Show this QR code to the cashier
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>2</Text>
                </View>
                <Text style={styles.instructionText}>
                  Cashier scans to link your purchase
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>3</Text>
                </View>
                <Text style={styles.instructionText}>
                  Earn points automatically!
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Done Button - Fixed at bottom */}
          <View
            style={[
              styles.doneButtonContainer,
              { paddingBottom: insets.bottom + 16 },
            ]}
          >
            <TouchableOpacity
              onPress={onClose}
              style={styles.doneButton}
              activeOpacity={0.8}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeIcon: {
    fontSize: 18,
    color: COLORS.white,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.lg,
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
    color: COLORS.white,
  },
  instructions: {
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructionNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  instructionNumberText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.white,
  },
  instructionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.white,
    flex: 1,
  },
  doneButtonContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.base,
    backgroundColor: 'transparent',
  },
  doneButton: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.base,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  doneButtonText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
