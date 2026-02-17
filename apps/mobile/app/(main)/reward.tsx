// app/(main)/reward.tsx — Brands list screen

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SearchBar } from '../../src/components/rewards';
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

  const handleSearch = useCallback(
    (text: string) => {
      setSearchDebounce(text);
      const timer = setTimeout(() => setSearchQuery(text), 300);
      return () => clearTimeout(timer);
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Explore Brands</Text>
      </View>

      {/* Search */}
      <SearchBar
        value={searchDebounce}
        onChangeText={handleSearch}
        placeholder="Search brands..."
      />

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
    backgroundColor: COLORS.gray[50],
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
});
