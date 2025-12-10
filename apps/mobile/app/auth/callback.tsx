// app/auth/callback.tsx

import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { COLORS } from '../../src/lib/constants';

export default function AuthCallback() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();

  useEffect(() => {
    if (!isInitialized) return;
    console.log('Auth callback loaded, user:', user);
    // Wait a bit for auth state to settle, then redirect
    const timer = setTimeout(() => {
      if (user) {
        router.replace('/(main)');
      } else {
        router.replace('/(auth)/welcome');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [user, isInitialized]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
});
