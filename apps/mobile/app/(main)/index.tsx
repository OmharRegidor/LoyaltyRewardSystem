// app/(main)/index.tsx

import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ScrollView,
  StatusBar,
  RefreshControl,
} from 'react-native';

import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { useCustomer } from '../../src/hooks/useCustomer';
import { useNotifications } from '../../src/hooks/useNotifications';
import { useStampCards } from '../../src/hooks/useStampCards';
import {
  HeaderSection,
  BalanceCard,
  MemberQRCard,
  RedeemableRewards,
} from '../../src/components/home';
import { StampCardWidget } from '../../src/components/home/StampCardWidget';
import { COLORS, SPACING, FONT_SIZE } from '../../src/lib/constants';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isLoading } = useAuth();
  const { qrCodeUrl, points, lifetimePoints, refreshCustomer } = useCustomer();
  const { unreadCount, refresh: refreshNotifications } = useNotifications();
  const { stampCards } = useStampCards();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Refresh notification count when screen regains focus
  useFocusEffect(
    useCallback(() => {
      refreshNotifications();
    }, [refreshNotifications])
  );

  // Get display name from Google OAuth metadata
  const displayName =
    user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = user?.user_metadata?.avatar_url || null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshCustomer();
    setIsRefreshing(false);
  };

  const handleAvatarPress = () => {
    router.push('/(main)/profile');
  };


  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Header Background */}
        <View style={[styles.gradientHeader, { paddingTop: insets.top, backgroundColor: COLORS.primary }]}>
          {/* Header with Welcome + Avatar */}
          <HeaderSection
            name={displayName}
            avatarUri={avatarUrl}
            onAvatarPress={handleAvatarPress}
            unreadCount={unreadCount}
            onBellPress={() => router.push('/notifications')}
          />

          {/* Points Balance + Tier Progress */}
          <BalanceCard points={points} lifetimePoints={lifetimePoints} />
        </View>

        {/* White Content Area */}
        <View style={styles.contentArea}>
          {/* QR Card - overlaps gradient */}
          <MemberQRCard qrCodeUrl={qrCodeUrl} isLoading={isLoading} />

          {/* Stamp Cards */}
          {stampCards.length > 0 && (
            <View style={styles.stampSection}>
              <Text style={styles.sectionTitle}>Your Stamp Cards</Text>
              <FlatList
                data={stampCards}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: SPACING.md }}
                renderItem={({ item }) => (
                  <StampCardWidget
                    stampCard={item}
                    onPress={() => router.push(`/brand/${item.business_id}`)}
                  />
                )}
              />
            </View>
          )}

          {/* Redeemable Rewards */}
          <RedeemableRewards />

          {/* Nearby Businesses */}
          {/* <NearbyBusinesses onBusinessPress={handleBusinessPress} /> */}

          {/* Bottom spacing for tab bar */}
          <View style={{ height: SPACING['3xl'] }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  gradientHeader: {
    paddingBottom: SPACING['3xl'] + SPACING.xl, // Extra space for QR card overlap
  },
  contentArea: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
    marginTop: -SPACING.xl, // Pull up to meet gradient
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  stampSection: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700' as const,
    color: COLORS.gray[900],
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
});
