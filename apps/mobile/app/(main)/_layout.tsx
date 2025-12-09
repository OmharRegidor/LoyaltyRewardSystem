// app/(main)/_layout.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { FullScreenLoading } from '../../src/components/ui/Loading';
import { COLORS, SHADOWS } from '../../src/lib/constants';

export default function MainLayout() {
  const { user, isInitialized } = useAuth();

  if (!isInitialized) {
    return <FullScreenLoading />;
  }

  if (!user) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray[400],
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon emoji="🏠" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Rewards',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon emoji="🎁" focused={focused} isCenter />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon emoji="💳" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon emoji="👤" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

// Simple tab bar icon with emoji
function TabBarIcon({
  emoji,
  focused,
  isCenter,
}: {
  emoji: string;
  focused: boolean;
  isCenter?: boolean;
}) {
  if (isCenter) {
    return (
      <View style={styles.centerButton}>
        <View style={styles.centerButtonInner}>
          <Text style={styles.centerEmoji}>{emoji}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.emoji, { opacity: focused ? 1 : 0.6 }]}>
        {emoji}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 0,
    height: 80,
    paddingBottom: 20,
    paddingTop: 10,
    ...SHADOWS.lg,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  tabBarItem: {
    paddingTop: 8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    // Active state
  },
  iconInner: {
    alignItems: 'center',
  },
  emojiContainer: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconFocused: {
    // Focused state
  },
  centerButton: {
    position: 'absolute',
    top: -20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.colored(COLORS.primary),
  },
  centerEmoji: {
    fontSize: 24,
    color: COLORS.white,
  },
});
