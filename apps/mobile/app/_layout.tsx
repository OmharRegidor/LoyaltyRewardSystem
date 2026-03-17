// app/_layout.tsx

import { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '../src/providers/AuthProvider';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Configure foreground notification display (no-op in Expo Go)
try {
  const Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  // expo-notifications not available in Expo Go
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  // Safety: force-hide splash screen after 3 seconds in case fonts never load
  useEffect(() => {
    const timeout = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <PushNotificationHandler />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(main)" />
        <Stack.Screen name="brand/[id]" />
        <Stack.Screen name="referral" />
        <Stack.Screen name="notifications" />
      </Stack>
    </AuthProvider>
  );
}

/** Handles push notification taps and navigates to the relevant brand page */
function PushNotificationHandler() {
  const router = useRouter();
  const listenerRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    try {
      const Notifications = require('expo-notifications');

      listenerRef.current =
        Notifications.addNotificationResponseReceivedListener(
          (response: { notification: { request: { content: { data: Record<string, unknown> } } } }) => {
            const data = response.notification.request.content.data;
            const businessId = data?.business_id as string | undefined;

            if (businessId) {
              router.push(`/brand/${businessId}`);
            }
          },
        );
    } catch {
      // expo-notifications not available in Expo Go
    }

    return () => {
      listenerRef.current?.remove();
    };
  }, [router]);

  return null;
}
