// src/components/wallet/SegmentTabs.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from '../../lib/constants';
import type { WalletTab } from '../../types/wallet.types';

interface SegmentTabsProps {
  activeTab: WalletTab;
  onTabChange: (tab: WalletTab) => void;
}

export function SegmentTabs({ activeTab, onTabChange }: SegmentTabsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.tabsWrapper}>
        {/* Transactions Tab */}
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => onTabChange('transactions')}
          activeOpacity={0.8}
        >
          {activeTab === 'transactions' ? (
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.activeTab}
            >
              <Text style={styles.activeTabText}>Transactions</Text>
            </LinearGradient>
          ) : (
            <View style={styles.inactiveTab}>
              <Text style={styles.inactiveTabText}>Transactions</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* My Rewards Tab */}
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => onTabChange('rewards')}
          activeOpacity={0.8}
        >
          {activeTab === 'rewards' ? (
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.activeTab}
            >
              <Text style={styles.activeTabText}>My Rewards</Text>
            </LinearGradient>
          ) : (
            <View style={styles.inactiveTab}>
              <Text style={styles.inactiveTabText}>My Rewards</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: -28,
    marginBottom: SPACING.base,
    zIndex: 10,
  },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 4,
    width: '86%',
    ...SHADOWS.md,
  },
  tabButton: {
    flex: 1,
  },
  activeTab: {
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  inactiveTab: {
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  activeTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  inactiveTabText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.gray[500],
  },
});
