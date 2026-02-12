// app/(main)/index.tsx

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  RefreshControl,
} from 'react-native';

import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../src/hooks/useAuth';
import { useCustomer } from '../../src/hooks/useCustomer';
import {
  HeaderSection,
  BalanceCard,
  MemberQRCard,
  QuickActions,
  NearbyBusinesses,
  RedeemableRewards,
} from '../../src/components/home';
import { COLORS, SPACING } from '../../src/lib/constants';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isLoading } = useAuth();
  const { qrCodeUrl, points, lifetimePoints, refreshCustomer } = useCustomer();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

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
          />

          {/* Points Balance + Tier Progress */}
          <BalanceCard points={points} lifetimePoints={lifetimePoints} />
        </View>

        {/* White Content Area */}
        <View style={styles.contentArea}>
          {/* QR Card - overlaps gradient */}
          <MemberQRCard qrCodeUrl={qrCodeUrl} isLoading={isLoading} />

          {/* Quick Actions */}
          {/* <QuickActions /> */}

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
});
