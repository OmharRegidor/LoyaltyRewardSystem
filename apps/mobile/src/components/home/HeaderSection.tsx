// src/components/home/HeaderSection.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../ui/Avatar';
import { COLORS, SPACING, FONT_SIZE } from '../../lib/constants';

interface HeaderSectionProps {
  name: string;
  avatarUri?: string | null;
  onAvatarPress?: () => void;
  unreadCount?: number;
  onBellPress?: () => void;
}

export function HeaderSection({
  name,
  avatarUri,
  onAvatarPress,
  unreadCount = 0,
  onBellPress,
}: HeaderSectionProps) {
  const firstName = name.split(' ')[0];

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.nameText}>{firstName}!</Text>
      </View>

      <View style={styles.rightSection}>
        {/* Bell icon */}
        <TouchableOpacity onPress={onBellPress} style={styles.bellBtn} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.white} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <Avatar
          uri={avatarUri}
          name={name}
          size={48}
          onPress={onAvatarPress}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.base,
  },
  textContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '400',
  },
  nameText: {
    fontSize: FONT_SIZE['2xl'],
    color: COLORS.white,
    fontWeight: '700',
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  bellBtn: {
    position: 'relative',
    padding: SPACING.xs,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});