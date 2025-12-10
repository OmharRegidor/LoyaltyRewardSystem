// app/index.tsx

import { useEffect, useState } from 'react';
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

    if (user) {
      router.replace('/(main)');
    } else {
      router.replace('/(auth)/welcome');
    }
  }, [user, isInitialized, isLoading, segments]);

  // Show loading while checking auth state
  return <FullScreenLoading message="Loading..." />;
}
