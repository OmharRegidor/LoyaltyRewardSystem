// src/components/home/NearbyBusinesses.tsx

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  SHADOWS,
} from '../../lib/constants';

const CARD_WIDTH = 220;
const CARD_GAP = 12;

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
    imageUrl:
      'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=200&h=200&fit=crop',
  },
  {
    id: '2',
    name: 'Sweet Delights',
    distance: '0.8 mi',
    status: 'open',
    rating: 4.5,
    pointsMultiplier: '1.5x Points',
    imageUrl:
      'https://images.unsplash.com/photo-1517433670267-30f41c098e5e?w=200&h=200&fit=crop',
  },
  {
    id: '3',
    name: 'Pizza Palace',
    distance: '1.2 mi',
    status: 'open',
    rating: 4.6,
    pointsMultiplier: '2x Points',
    imageUrl:
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop',
  },
];

interface NearbyBusinessesProps {
  onBusinessPress?: (business: Business) => void;
}

export function NearbyBusinesses({ onBusinessPress }: NearbyBusinessesProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + CARD_GAP));
    setActiveIndex(Math.min(index, MOCK_BUSINESSES.length - 1));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nearby Businesses</Text>
        <View style={styles.dots}>
          {MOCK_BUSINESSES.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, activeIndex === index && styles.dotActive]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
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
                <Text
                  style={[
                    styles.status,
                    business.status === 'open' && styles.statusOpen,
                  ]}
                >
                  {business.status === 'open' ? 'Open now' : 'Closed'}
                </Text>
              </View>
              <View style={styles.bottomRow}>
                <View style={styles.ratingContainer}>
                  <Text style={styles.star}>⭐</Text>
                  <Text style={styles.rating}>{business.rating}</Text>
                </View>
                <Text style={styles.multiplier}>
                  {business.pointsMultiplier}
                </Text>
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
    marginBottom: 35, // Space for bottom tab bar
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
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gray[300],
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 20,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.base,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginRight: CARD_GAP,
    ...SHADOWS.md,
  },
  image: {
    width: '100%',
    height: 110,
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
