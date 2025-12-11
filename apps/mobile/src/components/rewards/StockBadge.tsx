// src/components/rewards/StockBadge.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZE } from '../../lib/constants';

interface StockBadgeProps {
  stock: number;
}

export function StockBadge({ stock }: StockBadgeProps) {
  const isLowStock = stock <= 5;
  const isOutOfStock = stock === 0;

  if (isOutOfStock) {
    return (
      <View style={styles.container}>
        <Text style={[styles.text, styles.outOfStock]}>Out of Stock</Text>
      </View>
    );
  }

  if (isLowStock) {
    return (
      <View style={styles.container}>
        <Text style={[styles.text, styles.lowStock]}>Only {stock} left!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.text, styles.inStock]}>In Stock</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.xs,
  },
  text: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  inStock: {
    color: COLORS.success,
  },
  lowStock: {
    color: COLORS.warning,
  },
  outOfStock: {
    color: COLORS.error,
  },
});