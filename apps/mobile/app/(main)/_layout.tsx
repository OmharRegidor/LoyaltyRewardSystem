// app/(main)/_layout.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Tabs, Redirect, usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useAuth } from '../../src/hooks/useAuth';
import { useCustomer } from '../../src/hooks/useCustomer';
import { FullScreenLoading } from '../../src/components/ui/Loading';

import {
  EarnPointsProvider,
  useEarnPoints,
} from '../../src/providers/EarnPointsProvider';
import { QuickQRModal } from '@/src/components/home';

// ============================================
// ICON COMPONENTS - Clean outlined style
// ============================================

function HomeIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3L21 9.5V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9.5Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 22V12H15V22"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BrandsIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 21H21"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M3 7L12 3L21 7"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 7V21"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M20 7V21"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Rect
        x="9"
        y="13"
        width="6"
        height="8"
        rx="1"
        stroke={color}
        strokeWidth={1.8}
      />
      <Path
        d="M9 10H15"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function WalletIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="2"
        y="5"
        width="20"
        height="15"
        rx="3"
        stroke={color}
        strokeWidth={1.8}
      />
      <Path
        d="M22 10H17C15.8954 10 15 10.8954 15 12C15 13.1046 15.8954 14 17 14H22"
        stroke={color}
        strokeWidth={1.8}
      />
      <Circle cx="17" cy="12" r="1" fill={color} />
    </Svg>
  );
}

function ProfileIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={1.8} />
      <Path
        d="M4 21C4 17.134 7.58172 14 12 14C16.4183 14 20 17.134 20 21"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function EarnIcon({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* QR Frame corners */}
      <Path
        d="M3 7V5C3 3.89543 3.89543 3 5 3H7"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M17 3H19C20.1046 3 21 3.89543 21 5V7"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M21 17V19C21 20.1046 20.1046 21 19 21H17"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M7 21H5C3.89543 21 3 20.1046 3 19V17"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* QR code pattern */}
      <Rect x="7" y="7" width="4" height="4" rx={0.5} fill="white" />
      <Rect x="13" y="7" width="4" height="4" rx={0.5} fill="white" />
      <Rect x="7" y="13" width="4" height="4" rx={0.5} fill="white" />
      <Rect x="13" y="13" width="4" height="4" rx={0.5} fill="white" />
    </Svg>
  );
}

// ============================================
// CUSTOM TAB BAR COMPONENT
// ============================================

function CustomTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { openModal } = useEarnPoints();

  const tabs = [
    { name: 'index', label: 'Home', Icon: HomeIcon, route: '/(main)' },
    {
      name: 'reward',
      label: 'Brands',
      Icon: BrandsIcon,
      route: '/(main)/reward',
    },
    { name: 'earn', label: 'Earn', Icon: null, route: null }, // Center button
    {
      name: 'wallet',
      label: 'Wallet',
      Icon: WalletIcon,
      route: '/(main)/wallet',
    },
    {
      name: 'profile',
      label: 'Profile',
      Icon: ProfileIcon,
      route: '/(main)/profile',
    },
  ];

  const isActive = (name: string) => {
    if (name === 'index')
      return pathname === '/' || pathname === '/(main)' || pathname === '';
    return pathname.includes(name);
  };

  const handlePress = (route: string | null, name: string) => {
    if (name === 'earn') {
      openModal();
      return;
    }
    if (route) {
      router.push(route as any);
    }
  };

  return (
    <View
      style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}
    >
      {tabs.map((tab) => {
        const active = isActive(tab.name);

        // Center Earn Button
        if (tab.name === 'earn') {
          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => handlePress(tab.route, tab.name)}
              activeOpacity={0.8}
              style={styles.centerButtonContainer}
            >
              <View style={[styles.centerButton, { backgroundColor: '#C46B02' }]}>
                <EarnIcon size={28} />
              </View>
            </TouchableOpacity>
          );
        }

        const IconComponent = tab.Icon!;

        return (
          <TouchableOpacity
            key={tab.name}
            onPress={() => handlePress(tab.route, tab.name)}
            activeOpacity={0.7}
            style={styles.tabItem}
          >
            <IconComponent color={active ? '#7F0404' : '#a3a3a3'} size={24} />
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ============================================
// MODAL WRAPPER - Needs customer data
// ============================================

function QRModalWrapper() {
  const { isModalVisible, closeModal } = useEarnPoints();
  const { customer, points, qrCodeUrl } = useCustomer();
  const { user } = useAuth();

  const customerName =
    user?.user_metadata?.full_name || user?.email || 'Customer';

  return (
    <QuickQRModal
      visible={isModalVisible}
      onClose={closeModal}
      qrCodeUrl={qrCodeUrl || ''}
      customerName={customerName}
      points={points}
    />
  );
}

// ============================================
// MAIN LAYOUT
// ============================================

function MainLayoutContent() {
  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="reward" />
        <Tabs.Screen name="wallet" />
        <Tabs.Screen name="profile" />
      </Tabs>
      <CustomTabBar />
      <QRModalWrapper />
    </View>
  );
}

export default function MainLayout() {
  const { user, isInitialized } = useAuth();

  if (!isInitialized) {
    return <FullScreenLoading />;
  }

  if (!user) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <EarnPointsProvider>
      <MainLayoutContent />
    </EarnPointsProvider>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingHorizontal: 8,
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#a3a3a3',
    marginTop: 6,
  },
  tabLabelActive: {
    color: '#7F0404',
  },
  centerButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -28,
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C46B02',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
