// src/components/rewards/FilterTabs.tsx

import React from 'react';
import { Text, ScrollView, TouchableOpacity, StyleSheet, View } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../lib/constants';
import type { RewardCategory } from '../../types/rewards.types';

interface FilterTabsProps {
  activeCategory: RewardCategory;
  onCategoryChange: (category: RewardCategory) => void;
}

const CATEGORIES: { key: RewardCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'food', label: 'Food' },
  { key: 'drinks', label: 'Drinks' },
  { key: 'discounts', label: 'Discounts' },
  { key: 'free', label: 'Prods' },
];

export function FilterTabs({ activeCategory, onCategoryChange }: FilterTabsProps) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category.key;
          
          return (
            <TouchableOpacity
              key={category.key}
              onPress={() => onCategoryChange(category.key)}
              activeOpacity={0.7}
              style={[
                styles.tab,
                isActive && styles.tabActive,
              ]}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 52,
    marginBottom: SPACING.sm,
  },
  container: {
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
  },
  tab: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    marginRight: SPACING.sm,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: COLORS.gray[500],
  },
  tabTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
});