// app/referral.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useReferral } from '../src/hooks/useReferral';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  FONT_WEIGHT,
  BORDER_RADIUS,
  SHADOWS,
} from '../src/lib/constants';

// ============================================
// MAIN SCREEN
// ============================================

export default function ReferralScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    businesses,
    selectedBusinessId,
    setSelectedBusinessId,
    referralCode,
    history,
    isLoadingBusinesses,
    isLoadingCode,
    isLoadingHistory,
    error,
    shareReferralCode,
  } = useReferral();

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!referralCode) return;
    try {
      const Clipboard = require('expo-clipboard');
      await Clipboard.setStringAsync(referralCode);
    } catch {
      // Fallback: share instead if clipboard native module unavailable
      const { Share } = require('react-native');
      await Share.share({ message: referralCode });
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Refer a Friend</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroEmoji}>🎁</Text>
          <Text style={styles.heroTitle}>Give 25, Get 25</Text>
          <Text style={styles.heroSubtitle}>
            Share your code with friends. When they join, you both earn 25 bonus
            points!
          </Text>
        </LinearGradient>

        {/* How It Works Stepper */}
        <View style={styles.stepperContainer}>
          <View style={styles.stepItem}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepEmoji}>📤</Text>
            </View>
            <Text style={styles.stepLabel}>Send Code</Text>
          </View>

          <View style={styles.stepConnector} />

          <View style={styles.stepItem}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepEmoji}>👋</Text>
            </View>
            <Text style={styles.stepLabel}>Friend Joins</Text>
          </View>

          <View style={styles.stepConnector} />

          <View style={styles.stepItem}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepEmoji}>🎉</Text>
            </View>
            <Text style={styles.stepLabel}>Both Earn</Text>
          </View>
        </View>

        {/* Business Selector */}
        {isLoadingBusinesses ? (
          <ActivityIndicator
            size="small"
            color={COLORS.primary}
            style={styles.loader}
          />
        ) : businesses.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateEmoji}>🏪</Text>
            <Text style={styles.emptyStateTitle}>No businesses yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Join a business loyalty program to start referring friends.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.businessList}
            contentContainerStyle={styles.businessListContent}
          >
            {businesses.map((biz) => {
              const isSelected = selectedBusinessId === biz.business_id;
              return (
                <TouchableOpacity
                  key={biz.business_id}
                  style={[
                    styles.businessChip,
                    isSelected && styles.businessChipSelected,
                  ]}
                  onPress={() => setSelectedBusinessId(biz.business_id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.businessAvatar,
                      isSelected && styles.businessAvatarSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.businessAvatarText,
                        isSelected && styles.businessAvatarTextSelected,
                      ]}
                    >
                      {biz.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.businessName,
                      isSelected && styles.businessNameSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {biz.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Referral Code Display */}
        {selectedBusinessId && (
          <View style={styles.codeSection}>
            {isLoadingCode ? (
              <ActivityIndicator
                size="small"
                color={COLORS.primary}
                style={styles.loader}
              />
            ) : error ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : referralCode ? (
              <>
                <View style={styles.codeCard}>
                  <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
                  <Text style={styles.codeText}>{referralCode}</Text>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={handleCopy}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.copyButtonText}>
                      {copied ? 'Copied!' : 'Copy Code'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={shareReferralCode}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.shareButtonText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        )}

        {/* Referral History */}
        <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>
          Referral History
        </Text>
        {isLoadingHistory ? (
          <ActivityIndicator
            size="small"
            color={COLORS.primary}
            style={styles.loader}
          />
        ) : history.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateEmoji}>👥</Text>
            <Text style={styles.emptyStateTitle}>No referrals yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Your squad is empty! Share your code and invite friends to earn
              rewards together.
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {history.map((item) => {
              const initial = item.invitee?.full_name
                ? item.invitee.full_name.charAt(0).toUpperCase()
                : 'C';
              return (
                <View key={item.id} style={styles.historyItem}>
                  <View style={styles.historyAvatar}>
                    <Text style={styles.historyAvatarText}>{initial}</Text>
                  </View>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyName}>
                      {item.invitee?.full_name || 'Customer'}
                    </Text>
                    <Text style={styles.historyBusiness}>
                      {item.business?.name || 'Business'}
                    </Text>
                    <Text style={styles.historyDate}>
                      {new Date(item.completed_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.pointsBadge}>
                    <Text style={styles.pointsBadgeText}>
                      +{item.referrer_points} pts
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: SPACING['3xl'] }} />
      </ScrollView>
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  backButton: {
    width: 60,
  },
  backText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.gray[900],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.base,
  },

  // Hero Card
  heroCard: {
    borderRadius: BORDER_RADIUS['2xl'],
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.colored(COLORS.primary),
  },
  heroEmoji: {
    fontSize: FONT_SIZE['4xl'],
    marginBottom: SPACING.sm,
  },
  heroTitle: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  heroSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.white,
    opacity: 0.85,
    textAlign: 'center',
    lineHeight: 20,
  },

  // How It Works Stepper
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  stepEmoji: {
    fontSize: FONT_SIZE.xl,
  },
  stepLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.gray[700],
  },
  stepConnector: {
    height: 2,
    flex: 1,
    backgroundColor: COLORS.gray[200],
    marginHorizontal: SPACING.sm,
    marginBottom: SPACING.lg,
  },

  // Business Chips
  sectionTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.gray[900],
    marginBottom: SPACING.md,
  },
  loader: {
    marginVertical: SPACING.lg,
  },
  businessList: {
    marginBottom: SPACING.lg,
  },
  businessListContent: {
    gap: SPACING.sm,
  },
  businessChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
    ...SHADOWS.sm,
  },
  businessChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  businessAvatar: {
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  businessAvatarSelected: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  businessAvatarText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.gray[600],
  },
  businessAvatarTextSelected: {
    color: COLORS.white,
  },
  businessName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.gray[700],
    maxWidth: 100,
  },
  businessNameSelected: {
    color: COLORS.white,
  },

  // Code Section
  codeSection: {
    marginTop: SPACING.sm,
  },
  codeCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS['2xl'],
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  codeLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.gray[400],
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  codeText: {
    fontSize: FONT_SIZE['3xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
    letterSpacing: 8,
    fontFamily: 'monospace',
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.base,
  },
  copyButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS['2xl'],
    paddingVertical: SPACING.base,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  copyButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  shareButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS['2xl'],
    paddingVertical: SPACING.base,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },

  // Error
  errorCard: {
    backgroundColor: COLORS.error + '10',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
  },
  errorText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.error,
  },

  // Empty State
  emptyStateCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS['2xl'],
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  emptyStateEmoji: {
    fontSize: FONT_SIZE['5xl'],
    marginBottom: SPACING.sm,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.gray[900],
    marginBottom: SPACING.xs,
  },
  emptyStateSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 20,
  },

  // History
  historyList: {
    gap: SPACING.sm,
  },
  historyItem: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  historyAvatar: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  historyAvatarText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  historyLeft: {
    flex: 1,
  },
  historyName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.gray[900],
  },
  historyBusiness: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  historyDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray[400],
    marginTop: 2,
  },
  pointsBadge: {
    backgroundColor: COLORS.success + '15',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  pointsBadgeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.success,
  },
});
