// src/components/home/QuickActions.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  SHADOWS,
} from '../../lib/constants';

interface ActionItem {
  id: string;
  icon: string;
  label: string;
  sublabel?: string;
  route?: string;
  color: string;
}

const ACTIONS: ActionItem[] = [
  {
    id: 'stores',
    icon: '📍',
    label: 'Find Stores',
    sublabel: 'Map View',
    route: '/stores',
    color: '#6366F1',
  },
  {
    id: 'rewards',
    icon: '🎁',
    label: 'Rewards',
    sublabel: 'Browse Catalog',
    route: '/rewards',
    color: '#10B981',
  },
  {
    id: 'referral',
    icon: '👥',
    label: 'Referral',
    sublabel: 'Invite Friends',
    route: '/referral',
    color: '#F59E0B',
  },
];

interface QuickActionsProps {
  onViewAll?: () => void;
}

export function QuickActions({ onViewAll }: QuickActionsProps) {
  const router = useRouter();

  const handleActionPress = (action: ActionItem) => {
    if (action.route) {
      // router.push(action.route as any);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quick Actions</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionCard}
            onPress={() => handleActionPress(action)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: action.color + '15' },
              ]}
            >
              <Text style={styles.icon}>{action.icon}</Text>
            </View>
            <Text style={styles.label}>{action.label}</Text>
            {action.sublabel && (
              <Text style={styles.sublabel}>{action.sublabel}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  viewAll: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.base,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  icon: {
    fontSize: 24,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.gray[900],
    textAlign: 'center',
  },
  sublabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginTop: 2,
  },
});
