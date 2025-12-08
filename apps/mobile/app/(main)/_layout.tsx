// app/(main)/_layout.tsx

import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { FullScreenLoading } from '../../src/components/ui/Loading';
import { COLORS } from '../../src/lib/constants';

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
        tabBarStyle: {
          borderTopColor: COLORS.gray[200],
          backgroundColor: COLORS.white,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="home" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

// Simple tab icon component
function TabIcon({
  name,
  color,
  size,
}: {
  name: string;
  color: string;
  size: number;
}) {
  const icons: Record<string, string> = {
    home: '🏠',
    qr: '📱',
    rewards: '🎁',
    profile: '👤',
  };

  return <span style={{ fontSize: size, color }}>{icons[name] || '•'}</span>;
}
