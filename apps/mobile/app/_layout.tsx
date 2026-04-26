// app/_layout.tsx

import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { InteractionManager, View, Text, TouchableOpacity } from 'react-native';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { AuthProvider } from '../src/providers/AuthProvider';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

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
  const [appReady, setAppReady] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (fontsLoaded) {
      // Wait for all interactions/animations to complete before hiding splash
      // This ensures touch handlers are fully registered on first install
      InteractionManager.runAfterInteractions(() => {
        SplashScreen.hideAsync().catch(() => {});
        setAppReady(true);
      });
    }
  }, [fontsLoaded]);

  // Safety: force-hide splash screen after 3 seconds in case fonts never load
  useEffect(() => {
    const timeout = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
      setAppReady(true);
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  // Check for OTA updates and prompt the user before applying
  useEffect(() => {
    if (__DEV__) return;
    (async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          setUpdateAvailable(true);
        }
      } catch {
        // Silent fail — update will apply on next natural restart
      }
    })();
  }, []);

  const handleApplyUpdate = async () => {
    await Updates.reloadAsync();
  };

  if (!fontsLoaded || !appReady) {
    return null;
  }

  return (
    <ErrorBoundary>
    <AuthProvider>
      <StatusBar style="dark" />
      {updateAvailable && (
        <View style={{ backgroundColor: '#7F0404', padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 14 }}>Update available</Text>
          <TouchableOpacity onPress={handleApplyUpdate}>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>Restart Now</Text>
          </TouchableOpacity>
        </View>
      )}
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
    </ErrorBoundary>
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
