// src/components/home/HeaderSection.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { COLORS, SPACING, FONT_SIZE } from '../../lib/constants';

interface HeaderSectionProps {
  name: string;
  avatarUri?: string | null;
  onAvatarPress?: () => void;
}

export function HeaderSection({ name, avatarUri, onAvatarPress }: HeaderSectionProps) {
  const firstName = name.split(' ')[0];

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.nameText}>{firstName}!</Text>
      </View>
      <Avatar
        uri={avatarUri}
        name={name}
        size={48}
        onPress={onAvatarPress}
      />
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
});