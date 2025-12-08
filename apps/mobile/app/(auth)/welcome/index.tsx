// app/(auth)/welcome.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../src/hooks/useAuth';
import { GoogleSignInButton } from '../../../src/components/auth/GoogleSignInButton';
import { Button } from '../../../src/components/ui/Button';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../../src/lib/constants';

export default function WelcomeScreen() {
  const { signInWithGoogle, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

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
    <LinearGradient
      colors={[COLORS.gray[50], COLORS.white]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          {/* Logo/Icon Area */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Text style={styles.logoText}>✦</Text>
            </LinearGradient>
          </View>

          {/* Welcome Text */}
          <Text style={styles.title}>Welcome</Text>
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
    </LinearGradient>
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
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.xl,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 40,
    color: COLORS.white,
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