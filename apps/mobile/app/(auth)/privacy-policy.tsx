// app/(auth)/privacy-policy.tsx

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

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient colors={['#7F0404', '#5A0303']} style={styles.header}>
        <SafeAreaView style={styles.headerInner}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
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
          <SectionHeader number={1} title="Introduction" />
          <Text style={styles.bodyText}>
            Welcome to NoxaLoyalty. We respect your privacy and are committed to
            protecting your personal data. This privacy policy will inform you as
            to how we look after your personal data when you use our application
            and tell you about your privacy rights and how the law protects you.
          </Text>
        </View>

        {/* Section 2 */}
        <View style={styles.card}>
          <SectionHeader number={2} title="Information We Collect" />
          <Text style={styles.bodyText}>
            We may collect, use, store and transfer different kinds of personal
            data about you which we have grouped together as follows:
          </Text>
          <BulletList
            items={[
              { label: 'Identity Data', description: 'includes first name, last name, username or similar identifier.' },
              { label: 'Contact Data', description: 'includes email address and telephone numbers.' },
              { label: 'Transaction Data', description: 'includes details about purchases, rewards points earned, and redemptions.' },
              { label: 'Technical Data', description: 'includes internet protocol (IP) address, device type, and app version.' },
            ]}
          />
        </View>

        {/* Section 3 */}
        <View style={styles.card}>
          <SectionHeader number={3} title="How We Use Your Information" />
          <Text style={styles.bodyText}>
            We will only use your personal data when the law allows us to. Most
            commonly, we will use your personal data to register you as a new
            user, manage your rewards account, process transactions and point
            redemptions, send you notifications about your rewards and
            promotions, and improve our application and services.
          </Text>
        </View>

        {/* Section 4 */}
        <View style={styles.card}>
          <SectionHeader number={4} title="Sign-In Data" />
          <Text style={styles.bodyText}>
            When you sign in with Google or Apple, we receive your name, email
            address, and profile picture. We use this information solely for
            authentication and account creation. We do not access your
            contacts, files, or other account data from these providers.
          </Text>
        </View>

        {/* Section 5 */}
        <View style={styles.card}>
          <SectionHeader number={5} title="Data Storage and Security" />
          <Text style={styles.bodyText}>
            Your data is stored securely using Supabase infrastructure. We
            implement appropriate security measures including encrypted
            connections, secure authentication tokens, and row-level security
            policies to protect your personal information.
          </Text>
        </View>

        {/* Section 6 */}
        <View style={styles.card}>
          <SectionHeader number={6} title="QR Code Data" />
          <Text style={styles.bodyText}>
            When you use QR code scanning features, the scanned data is used
            only for transaction processing and points allocation. We do not
            store images from your camera.
          </Text>
        </View>

        {/* Section 7 */}
        <View style={styles.card}>
          <SectionHeader number={7} title="Your Rights" />
          <Text style={styles.bodyText}>You have the right to:</Text>
          <BulletList
            items={[
              { label: 'Access', description: 'request access to your personal data.' },
              { label: 'Correction', description: 'request correction of your personal data.' },
              { label: 'Erasure', description: 'request erasure of your personal data.' },
              { label: 'Withdraw Consent', description: 'withdraw consent at any time.' },
            ]}
          />
        </View>

        {/* Section 8 */}
        <View style={styles.card}>
          <SectionHeader number={8} title="Contact Us" />
          <Text style={styles.bodyText}>
            If you have any questions about this privacy policy, please contact
            us at support@noxaloyalty.com.
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
