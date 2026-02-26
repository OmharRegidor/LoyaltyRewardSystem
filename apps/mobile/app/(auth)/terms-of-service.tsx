// app/(auth)/terms-of-service.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../src/lib/constants';

interface BulletItem {
  label: string;
  description: string;
}

function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <Text style={styles.sectionTitle}>
      {number}. {title}
    </Text>
  );
}

function BulletList({ items }: { items: BulletItem[] }) {
  return (
    <View style={styles.bulletList}>
      {items.map((item) => (
        <View key={item.label} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>{'\u2022'}</Text>
          <Text style={styles.bulletText}>
            <Text style={styles.bulletLabel}>{item.label}: </Text>
            {item.description}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function TermsOfServiceScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient colors={['#7F0404', '#5A0303']} style={styles.header}>
        <SafeAreaView style={styles.headerInner}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Terms of Service</Text>
          <View style={styles.backButton} />
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last updated: October 24, 2023</Text>

        {/* Section 1 */}
        <View style={styles.card}>
          <SectionHeader number={1} title="Acceptance of Terms" />
          <Text style={styles.bodyText}>
            By accessing and using this application, you agree to be bound by
            these Terms of Service and all applicable laws and regulations. If
            you do not agree with any of these terms, you are prohibited from
            using or accessing this application.
          </Text>
        </View>

        {/* Section 2 */}
        <View style={styles.card}>
          <SectionHeader number={2} title="Account Registration" />
          <Text style={styles.bodyText}>
            To access some features of the application, you may be required to
            register for an account. You agree to provide accurate and complete
            information and to keep this information up to date. You are solely
            responsible for the activity that occurs on your account and for
            keeping your account password secure.
          </Text>
        </View>

        {/* Section 3 */}
        <View style={styles.card}>
          <SectionHeader number={3} title="Rewards and Points" />
          <Text style={styles.bodyText}>
            Our rewards program is designed to reward frequent customers. Points
            earned are non-transferable and have no cash value. Points may expire
            if not redeemed within a specific period as defined by our reward
            policy.
          </Text>
          <BulletList
            items={[
              { label: 'Earning Points', description: 'Points are earned upon valid purchases made using the member QR code.' },
              { label: 'Redemption', description: 'Points can be redeemed for eligible rewards within the application.' },
              { label: 'Abuse', description: 'Any abuse of the points system may result in account termination.' },
              { label: 'Expiration', description: 'Points may expire if not redeemed within a specific period as defined by our reward policy.' },
            ]}
          />
        </View>

        {/* Section 4 */}
        <View style={styles.card}>
          <SectionHeader number={4} title="QR Code Usage" />
          <Text style={styles.bodyText}>
            Your member QR code is personal and non-transferable. Sharing or
            duplicating your QR code for unauthorized use is strictly prohibited
            and may result in account suspension.
          </Text>
        </View>

        {/* Section 5 */}
        <View style={styles.card}>
          <SectionHeader number={5} title="User Conduct" />
          <Text style={styles.bodyText}>You agree not to:</Text>
          <BulletList
            items={[
              { label: 'Unlawful Use', description: 'use the application for any unlawful purpose.' },
              { label: 'Unauthorized Access', description: 'attempt to gain unauthorized access to any part of the application.' },
              { label: 'Interference', description: 'interfere with the proper working of the application.' },
              { label: 'Impersonation', description: 'use another user\'s account or QR code.' },
            ]}
          />
        </View>

        {/* Section 6 */}
        <View style={styles.card}>
          <SectionHeader number={6} title="Limitation of Liability" />
          <Text style={styles.bodyText}>
            NoxaLoyalty shall not be liable for any indirect, incidental,
            special, or consequential damages resulting from the use or inability
            to use our services, including loss of points due to system errors or
            account termination.
          </Text>
        </View>

        {/* Section 7 */}
        <View style={styles.card}>
          <SectionHeader number={7} title="Changes to Terms" />
          <Text style={styles.bodyText}>
            We reserve the right to modify these terms at any time. We will
            notify you of any changes by updating the &quot;Last updated&quot; date. Your
            continued use of the application after changes constitutes acceptance
            of the new terms.
          </Text>
        </View>

        {/* Section 8 */}
        <View style={styles.card}>
          <SectionHeader number={8} title="Contact Us" />
          <Text style={styles.bodyText}>
            For any questions regarding these Terms of Service, please contact us
            at support@noxaloyalty.com.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: BORDER_RADIUS['3xl'],
    borderBottomRightRadius: BORDER_RADIUS['3xl'],
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING['3xl'],
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING['3xl'],
  },
  lastUpdated: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: SPACING.base,
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  bodyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray[700],
    lineHeight: 22,
  },
  bulletList: {
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    paddingLeft: SPACING.sm,
  },
  bulletDot: {
    fontSize: FONT_SIZE.base,
    color: COLORS.gray[700],
    marginRight: SPACING.sm,
    lineHeight: 22,
  },
  bulletText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray[700],
    lineHeight: 22,
    flex: 1,
  },
  bulletLabel: {
    fontWeight: '700',
    color: COLORS.gray[800],
  },
});
