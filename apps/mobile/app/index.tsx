// app/index.tsx

import { useEffect } from 'react';
import { InteractionManager } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { FullScreenLoading } from '../src/components/ui/Loading';

export default function Index() {
  const router = useRouter();
  const segments = useSegments();
  const { user, isInitialized, isLoading } = useAuth();

  useEffect(() => {
    if (!isInitialized) return;
    if (isLoading) return;

    if (segments.length > 0) return;

    // Delay navigation to let native touch handlers fully register
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        if (user) {
          router.replace('/(main)');
        } else {
          router.replace('/(auth)/welcome');
        }
      }, 300);
    });
  }, [user, isInitialized, isLoading, segments]);

  // Show loading while checking auth state
  return <FullScreenLoading message="Loading..." />;
}
