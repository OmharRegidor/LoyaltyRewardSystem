// app/(main)/index.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../src/hooks/useAuth';
import { useCustomer } from '../../src/hooks/useCustomer';
import { Button } from '../../src/components/ui/Button';
import { Skeleton } from '../../src/components/ui/Loading';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../src/lib/constants';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const { user, signOut, isLoading } = useAuth();
  const { customer, qrCode, points } = useCustomer();

  const displayName = customer?.full_name || user?.user_metadata?.full_name || 'Customer';
  const firstName = displayName.split(' ')[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {firstName} 👋</Text>
            <Text style={styles.subGreeting}>Welcome back!</Text>
          </View>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsValue}>{points}</Text>
            <Text style={styles.pointsLabel}>pts</Text>
          </View>
        </View>

        {/* QR Code Card */}
        <View style={styles.qrCard}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.qrGradientBorder}
          >
            <View style={styles.qrInner}>
              {qrCode ? (
                <>
                  <QRCode
                    value={qrCode}
                    size={180}
                    backgroundColor={COLORS.white}
                    color={COLORS.gray[900]}
                  />
                  <Text style={styles.qrCodeText}>{qrCode}</Text>
                </>
              ) : (
                <View style={styles.qrPlaceholder}>
                  <Skeleton width={180} height={180} />
                  <Skeleton width={120} height={16} style={{ marginTop: SPACING.md }} />
                </View>
              )}
            </View>
          </LinearGradient>

          <Text style={styles.qrInstruction}>
            Show this code to earn points
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <ActionCard icon="🎁" label="Rewards" />
            <ActionCard icon="📜" label="History" />
            <ActionCard icon="⭐" label="Offers" />
            <ActionCard icon="⚙️" label="Settings" />
          </View>
        </View>

        {/* Sign Out */}
        <Button
          onPress={signOut}
          variant="ghost"
          loading={isLoading}
          style={styles.signOutButton}
        >
          Sign Out
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionCard({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.actionCard}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  greeting: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  subGreeting: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  pointsBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  pointsValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  pointsLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.white,
    opacity: 0.8,
  },
  qrCard: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  qrGradientBorder: {
    padding: 3,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.lg,
  },
  qrInner: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl - 2,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  qrCodeText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray[500],
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  qrPlaceholder: {
    alignItems: 'center',
  },
  qrInstruction: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray[600],
  },
  quickActions: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: SPACING.md,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  actionLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray[700],
    fontWeight: '500',
  },
  signOutButton: {
    marginTop: SPACING.lg,
  },
});