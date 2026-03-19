// app/(auth)/welcome.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  Platform,
  ActivityIndicator,
  InteractionManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { GoogleSignInButton } from '../../src/components/auth/GoogleSignInButton';
import { AppleSignInButton } from '../../src/components/auth/AppleSignInButton';
import { COLORS, SPACING, FONT_SIZE } from '../../src/lib/constants';

const FEATURES = [
  { icon: 'gift' as const, text: 'Earn points on every visit', color: '#7F0404' },
  { icon: 'star' as const, text: 'Exclusive member rewards', color: '#D4A017' },
  { icon: 'qr-code' as const, text: 'Your QR code for easy scanning', color: '#22C55E' },
];

export default function WelcomeScreen() {
  const { signInWithGoogle, signInWithApple, isLoading, user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState<'google' | 'apple' | null>(null);

  // Track if sign-in was initiated (stays true until redirect)
  const isSigningIn = signingIn !== null || isLoading;

  React.useEffect(() => {
    if (user) {
      // Delay navigation to let native touch handlers fully register
      // Prevents freeze on first sign-in with New Architecture
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          router.replace('/(main)');
        }, 300);
      });
    }
  }, [user]);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setSigningIn('google');
      await signInWithGoogle();
      // Don't clear signingIn here — let isLoading from AuthProvider keep the loading state
      // until loadCustomer completes and user is set, triggering the redirect
    } catch (err) {
      setSigningIn(null);
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setError(message);
      Alert.alert('Sign In Failed', message);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setError(null);
      setSigningIn('apple');
      await signInWithApple();
      // Don't clear signingIn — keep loading until redirect
    } catch (err) {
      setSigningIn(null);
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setError(message);
      Alert.alert('Sign In Failed', message);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        {/* Hero Gradient Section */}
        <LinearGradient
          colors={['#7F0404', '#5A0303']}
          style={styles.hero}
        >
          <SafeAreaView style={styles.heroInner}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/images/logoloyalty.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            {/* Welcome Text */}
            <Text style={styles.title}>Welcome to NoxaLoyalty</Text>
            <Text style={styles.subtitle}>
              Earn rewards with every purchase.{'\n'}
              Scan, collect, and redeem.
            </Text>
          </SafeAreaView>
        </LinearGradient>

        {/* Features Section */}
        <View style={styles.body}>
          <View style={styles.features}>
            {FEATURES.map((feature) => (
              <View key={feature.icon} style={styles.featureItem}>
                <View style={[styles.iconContainer, { backgroundColor: feature.color }]}>
                  <Ionicons name={feature.icon} size={22} color="#fff" />
                </View>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>

          {/* Action Section */}
          <View style={styles.actions}>
            {Platform.OS === 'ios' && (
              <AppleSignInButton onPress={handleAppleSignIn} disabled={isSigningIn} />
            )}

            <GoogleSignInButton
              onPress={handleGoogleSignIn}
              loading={signingIn === 'google' || (isLoading && signingIn !== 'apple')}
              disabled={isSigningIn}
            />

            {signingIn === 'apple' && isLoading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>Signing you in...</Text>
              </View>
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Text style={styles.terms}>
              By continuing, you agree to our{' '}
              <Text style={styles.link} onPress={() => router.push('/(auth)/terms-of-service')}>
                Terms of Service
              </Text>{' '}and{' '}
              <Text style={styles.link} onPress={() => router.push('/(auth)/privacy-policy')}>
                Privacy Policy
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    paddingBottom: SPACING['2xl'],
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroInner: {
    alignItems: 'center',
    paddingTop: SPACING['3xl'],
    paddingHorizontal: SPACING.lg,
  },
  logoContainer: {
    marginBottom: SPACING.lg,
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  body: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    justifyContent: 'space-between',
  },
  features: {
    gap: 18,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.gray[800],
    flex: 1,
  },
  actions: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING['2xl'],
    gap: SPACING.base,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.gray[600],
    fontWeight: '500',
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  terms: {
    fontSize: 12,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: COLORS.primary,
    fontWeight: '500',
  },
});
