// src/components/home/NearbyBusinesses.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../lib/constants';

interface Business {
  id: string;
  name: string;
  distance: string;
  status: 'open' | 'closed';
  rating: number;
  pointsMultiplier: string;
  imageUrl: string;
}

// Mock data - replace with real data from Supabase
const MOCK_BUSINESSES: Business[] = [
  {
    id: '1',
    name: 'Bean & Brew Coffee',
    distance: '0.4 miles',
    status: 'open',
    rating: 4.8,
    pointsMultiplier: '2x Points',
    imageUrl: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=200&h=200&fit=crop',
  },
  {
    id: '2',
    name: 'Sweet Delights',
    distance: '0.8 mi',
    status: 'open',
    rating: 4.5,
    pointsMultiplier: '1.5x Points',
    imageUrl: 'https://images.unsplash.com/photo-1517433670267-30f41c098e5e?w=200&h=200&fit=crop',
  },
  {
    id: '3',
    name: 'Pizza Palace',
    distance: '1.2 mi',
    status: 'open',
    rating: 4.6,
    pointsMultiplier: '2x Points',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop',
  },
];

interface NearbyBusinessesProps {
  onBusinessPress?: (business: Business) => void;
}

export function NearbyBusinesses({ onBusinessPress }: NearbyBusinessesProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nearby Businesses</Text>
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {MOCK_BUSINESSES.map((business) => (
          <TouchableOpacity
            key={business.id}
            style={styles.card}
            onPress={() => onBusinessPress?.(business)}
            activeOpacity={0.7}
          >
            <Image source={{ uri: business.imageUrl }} style={styles.image} />
            <View style={styles.cardContent}>
              <Text style={styles.businessName} numberOfLines={1}>
                {business.name}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.distance}>{business.distance}</Text>
                <Text style={styles.separator}>•</Text>
                <Text style={[styles.status, business.status === 'open' && styles.statusOpen]}>
                  {business.status === 'open' ? 'Open now' : 'Closed'}
                </Text>
              </View>
              <View style={styles.bottomRow}>
                <View style={styles.ratingContainer}>
                  <Text style={styles.star}>⭐</Text>
                  <Text style={styles.rating}>{business.rating}</Text>
                </View>
                <Text style={styles.multiplier}>{business.pointsMultiplier}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.arrowButton}>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.base,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  dots: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.gray[300],
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 16,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  card: {
    width: 200,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  image: {
    width: '100%',
    height: 100,
    backgroundColor: COLORS.gray[200],
  },
  cardContent: {
    padding: SPACING.md,
  },
  businessName: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  distance: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray[500],
  },
  separator: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray[400],
    marginHorizontal: SPACING.xs,
  },
  status: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray[500],
  },
  statusOpen: {
    color: COLORS.success,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  star: {
    fontSize: 12,
  },
  rating: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  multiplier: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  arrowButton: {
    position: 'absolute',
    right: SPACING.md,
    top: SPACING.md,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  arrow: {
    fontSize: 14,
    color: COLORS.gray[700],
  },
});