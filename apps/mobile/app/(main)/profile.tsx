// app/(main)/profile.tsx

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { useCustomer } from '../../src/hooks/useCustomer';
import { Avatar } from '../../src/components/ui/Avatar';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { COLORS, SPACING, FONT_SIZE } from '../../src/lib/constants';

export default function ProfileScreen() {
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

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* Profile Card */}
      <Card style={styles.profileCard}>
        <View style={styles.profileInfo}>
          <Avatar uri={avatarUrl} name={displayName} size={72} />
          <View style={styles.profileText}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.email}>{email}</Text>
            <View style={styles.tierBadge}>
              <Text style={styles.tierText}>{currentTier.name} Member</Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Menu Items */}
      {/* <Card style={styles.menuCard}>
        <MenuItem icon="👤" label="Edit Profile" />
        <MenuItem icon="🔔" label="Notifications" />  
        <MenuItem icon="🔒" label="Privacy" />
        <MenuItem icon="❓" label="Help & Support" />
      </Card> */}

      {/* Sign Out */}
      <Button
        onPress={handleSignOut}
        variant="ghost"
        loading={isLoading}
        fullWidth
        style={styles.signOutButton}
      >
        Sign Out
      </Button>

      {/* Version */}
      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
}

function MenuItem({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.menuItem}>
      <View style={styles.menuLeft}>
        <Text style={styles.menuIcon}>{icon}</Text>
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <Text style={styles.menuArrow}>›</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  content: {
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  profileCard: {
    marginBottom: SPACING.base,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.base,
  },
  profileText: {
    flex: 1,
  },
  name: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  email: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  tierBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 100,
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
  },
  tierText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  menuCard: {
    marginBottom: SPACING.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  menuIcon: {
    fontSize: 20,
  },
  menuLabel: {
    fontSize: FONT_SIZE.base,
    color: COLORS.gray[900],
    fontWeight: '500',
  },
  menuArrow: {
    fontSize: 20,
    color: COLORS.gray[400],
  },
  signOutButton: {
    marginTop: SPACING.base,
  },
  version: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray[400],
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
});