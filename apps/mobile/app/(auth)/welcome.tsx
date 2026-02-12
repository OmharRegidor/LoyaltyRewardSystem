// app/(auth)/welcome.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';

import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { GoogleSignInButton } from '../../src/components/auth/GoogleSignInButton';
import { Button } from '../../src/components/ui/Button';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
} from '../../src/lib/constants';

export default function WelcomeScreen() {
  const { signInWithGoogle, isLoading, user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // Navigate when user becomes available
  React.useEffect(() => {
    if (user) {
      router.replace('/(main)');
    }
  }, [user]);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      await signInWithGoogle();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setError(message);
      Alert.alert('Sign In Failed', message);
    }
  };

  return (
    <View style={[styles.gradient, { backgroundColor: COLORS.white }]}>
      <SafeAreaView style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
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
        </View>

        {/* Features Preview */}
        <View style={styles.features}>
          <FeatureItem icon="🎁" text="Earn points on every visit" />
          <FeatureItem icon="⭐" text="Exclusive member rewards" />
          <FeatureItem icon="📱" text="Your QR code for easy scanning" />
        </View>

        {/* Action Section */}
        <View style={styles.actions}>
          <GoogleSignInButton
            onPress={handleGoogleSignIn}
            loading={isLoading}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Terms */}
          <Text style={styles.terms}>
            By continuing, you agree to our{' '}
            <Text style={styles.link}>Terms of Service</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: SPACING['3xl'],
  },
  logoContainer: {
    marginBottom: SPACING.xl,
  },
  logoImage: {
    width: 90,
    height: 90,
  },
  title: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZE.base,
    color: COLORS.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.gray[700],
    fontWeight: '500',
  },
  actions: {
    paddingBottom: SPACING['2xl'],
    gap: SPACING.base,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  terms: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: COLORS.primary,
    fontWeight: '500',
  },
});
