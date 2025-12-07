// app/index.tsx

import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { FullScreenLoading } from '../src/components/ui/Loading';

export default function Index() {
  const router = useRouter();
  const { user, isInitialized, isLoading } = useAuth();

  useEffect(() => {
    if (!isInitialized) return;

    if (user) {
      router.replace('/(main)');
    } else {
      router.replace('/(auth)/welcome');
    }
  }, [user, isInitialized, router]);

  // Show loading while checking auth state
  if (!isInitialized || isLoading) {
    return <FullScreenLoading message="Loading..." />;
  }

  return null;
}