// app/(main)/reward.tsx — Brands list screen

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BrandCard, BrandSkeletonList } from '../../src/components/brands';
import { EmptyState } from '../../src/components/rewards';
import { useBrands } from '../../src/hooks/useBrands';
import { COLORS, SPACING, FONT_SIZE } from '../../src/lib/constants';
import type { Brand } from '../../src/types/brands.types';

export default function BrandsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    brands,
    isLoading,
    isRefreshing,
    searchQuery,
    setSearchQuery,
    refresh,
  } = useBrands();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const [searchDebounce, setSearchDebounce] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(
    (text: string) => {
      setSearchDebounce(text);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => setSearchQuery(text), 300);
    },
    [setSearchQuery],
  );

  const handleBrandPress = useCallback(
    (brand: Brand) => {
      router.push({ pathname: '/brand/[id]', params: { id: brand.id } } as never);
    },
    [router],
  );

  const renderBrand = useCallback(
    ({ item }: { item: Brand }) => (
      <BrandCard brand={item} onPress={handleBrandPress} />
    ),
    [handleBrandPress],
  );

  const keyExtractor = useCallback((item: Brand) => item.id, []);

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={['#7F0404', '#5A0303']}
        style={[styles.gradientHeader, { paddingTop: insets.top + SPACING.base }]}
      >
        <Text style={styles.title}>Partner Brands</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="rgba(255,255,255,0.6)" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchDebounce}
            onChangeText={handleSearch}
            placeholder="Search brands..."
            placeholderTextColor="rgba(255,255,255,0.6)"
          />
        </View>
      </LinearGradient>

      {/* Content */}
      {isLoading ? (
        <BrandSkeletonList count={5} />
      ) : brands.length === 0 ? (
        <EmptyState
          title={searchQuery ? 'No brands found' : 'No Brands Available'}
          subtitle={
            searchQuery
              ? `No brands match "${searchQuery}"`
              : 'Check back later for new brands!'
          }
        />
      ) : (
        <FlatList
          data={brands}
          renderItem={renderBrand}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  gradientHeader: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: SPACING.base,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: SPACING.base,
    height: 44,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.base,
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.base,
    paddingBottom: 100,
  },
});
