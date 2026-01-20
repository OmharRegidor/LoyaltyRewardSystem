// src/components/wallet/WalletHeader.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from '../../lib/constants';

interface WalletHeaderProps {
  currentPoints: number;
  lifetimePoints: number;
}

function BackIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18L9 12L15 6"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HistoryIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="white" strokeWidth={1.8} />
      <Path
        d="M12 7V12L15 15"
        stroke="white"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function WalletHeader({
  currentPoints,
  lifetimePoints,
}: WalletHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#9B6AFF', '#6EBDFF', '#21D4B7']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: insets.top + 12 }]}
    >
      {/* Top Row - Back, Title, History */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <BackIcon />
        </TouchableOpacity>

        <Text style={styles.title}>My Wallet</Text>

        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
          <HistoryIcon />
        </TouchableOpacity>
      </View>

      {/* Points Display */}
      <View style={styles.pointsContainer}>
        <Text style={styles.pointsValue}>{currentPoints.toLocaleString()}</Text>
        <Text style={styles.pointsLabel}>CURRENT{'\n'}POINTS</Text>
        <Text style={styles.lifetimeText}>
          Lifetime earned: {lifetimePoints.toLocaleString()} pts
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 50, // Extra space for tab overlap
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  pointsContainer: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  pointsValue: {
    fontSize: 52,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: -1,
  },
  pointsLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: -4,
  },
  lifetimeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: SPACING.xs,
  },
});
