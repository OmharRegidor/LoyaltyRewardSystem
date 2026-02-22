// app/(main)/profile.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/hooks/useAuth';
import { useCustomer } from '../../src/hooks/useCustomer';
import { Avatar } from '../../src/components/ui/Avatar';
import { Badge } from '../../src/components/ui/Badge';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  SHADOWS,
} from '../../src/lib/constants';

interface MenuItemConfig {
  icon: string;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
  disabled?: boolean;
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut, isLoading } = useAuth();
  const { currentTier } = useCustomer();

  const displayName = user?.user_metadata?.full_name || 'User';
  const email = user?.email || '';
  const avatarUrl = user?.user_metadata?.avatar_url || null;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const menuItems: MenuItemConfig[] = [
    {
      icon: '🎁',
      iconBg: '#FFF3E0',
      title: 'Refer a Friend',
      subtitle: 'Get bonus pts per friend',
      onPress: () => router.push('/referral'),
    },
    {
      icon: '🏆',
      iconBg: '#F3E5F5',
      title: 'Rewards History',
      subtitle: 'Coming Soon',
      disabled: true,
    },
    {
      icon: '💳',
      iconBg: '#E3F2FD',
      title: 'Linked Cards',
      subtitle: 'Coming Soon',
      disabled: true,
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Gradient Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + SPACING.base }]}
      >
        <Text style={styles.headerTitle}>Profile</Text>

        <View style={styles.profileInfo}>
          <Avatar uri={avatarUrl} name={displayName} size={80} />
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
          <Badge variant="tier">
            {'⭐ ' + currentTier.name + ' Member'}
          </Badge>
        </View>
      </LinearGradient>

      {/* Menu List */}
      <View style={styles.menuCard}>
        {menuItems.map((item, index) => {
          const isLast = index === menuItems.length - 1;
          const row = (
            <View
              key={item.title}
              style={[
                styles.menuRow,
                !isLast && styles.menuRowBorder,
                item.disabled && styles.menuRowDisabled,
              ]}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: item.iconBg }]}>
                <Text style={styles.menuIconText}>{item.icon}</Text>
              </View>
              <View style={styles.menuTextContainer}>
                <Text
                  style={[
                    styles.menuTitle,
                    item.disabled && styles.menuTitleDisabled,
                  ]}
                >
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.menuSubtitle,
                    item.disabled && styles.menuSubtitleDisabled,
                  ]}
                >
                  {item.subtitle}
                </Text>
              </View>
              <Text
                style={[
                  styles.menuChevron,
                  item.disabled && styles.menuChevronDisabled,
                ]}
              >
                ›
              </Text>
            </View>
          );

          if (item.disabled || !item.onPress) {
            return row;
          }

          return (
            <TouchableOpacity
              key={item.title}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              {row}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
        activeOpacity={0.7}
        disabled={isLoading}
      >
        <Text style={styles.signOutText}>
          {isLoading ? 'Signing Out...' : 'Sign Out'}
        </Text>
      </TouchableOpacity>

      {/* Version */}
      <Text style={styles.versionText}>VERSION 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  contentContainer: {
    paddingBottom: SPACING['2xl'],
  },

  // Gradient Header
  header: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTitle: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.lg,
  },
  profileInfo: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  displayName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: SPACING.sm,
  },
  email: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.white,
    opacity: 0.7,
  },

  // Menu Card
  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    ...SHADOWS.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.base,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  menuRowDisabled: {
    opacity: 0.5,
  },
  menuIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconText: {
    fontSize: 18,
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  menuTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  menuTitleDisabled: {
    color: COLORS.gray[400],
  },
  menuSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  menuSubtitleDisabled: {
    color: COLORS.gray[300],
  },
  menuChevron: {
    fontSize: 22,
    color: COLORS.gray[400],
    fontWeight: '600',
  },
  menuChevronDisabled: {
    color: COLORS.gray[200],
  },

  // Sign Out
  signOutButton: {
    backgroundColor: COLORS.primary + '12',
    borderRadius: BORDER_RADIUS.xl,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Version
  versionText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray[400],
    textAlign: 'center',
    marginTop: SPACING.lg,
    letterSpacing: 1,
  },
});
