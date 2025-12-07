// src/components/auth/GoogleSignInButton.tsx

import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Button } from '../ui/Button';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS } from '../../lib/constants';

interface GoogleSignInButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

// Google "G" logo as inline SVG data
const GoogleLogo = () => (
  <View style={styles.logoContainer}>
    <Image
      source={{
        uri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIyLjU2IDEyLjI1QzIyLjU2IDExLjQ3IDIyLjQ5IDEwLjcyIDIyLjM2IDEwSDEyVjE0LjI2SDE3Ljk2QzE3LjcyIDE1LjYzIDE2Ljk4IDE2Ljc5IDE1Ljg0IDE3LjU3VjIwLjMzSDE5LjM0QzIxLjIyIDE4LjU5IDIyLjU2IDE1LjczIDIyLjU2IDEyLjI1WiIgZmlsbD0iIzQyODVGNCIvPgo8cGF0aCBkPSJNMTIgMjNDMTQuOTcgMjMgMTcuNDYgMjIuMDIgMTkuMzQgMjAuMzNMMTUuODQgMTcuNTdDMTQuOTYgMTguMTkgMTMuODQgMTguNTggMTIgMTguNThDOS4yNCAxOC41OCA2Ljg5IDE2LjgyIDYuMDIgMTQuMzhIMi40MlYxNy4yMUM0LjMyIDIwLjgzIDcuODkgMjMgMTIgMjNaIiBmaWxsPSIjMzRBODUzIi8+CjxwYXRoIGQ9Ik02LjAyIDE0LjM4QzUuNjUgMTMuMzggNS40NCAxMi4zIDUuNDQgMTEuMTlDNS40NCAxMC4wOSA1LjY1IDkuMDEgNi4wMiA4LjAxVjUuMThIMi40MkMxLjI3IDcuNDYgMC41OSA5LjkgMC41OSAxMi41QzAuNTkgMTUuMTEgMS4yNyAxNy41NCAyLjQyIDE5LjgyTDYuMDIgMTYuOTlWMTQuMzhaIiBmaWxsPSIjRkJCQzA1Ii8+CjxwYXRoIGQ9Ik0xMiA1LjM4QzEzLjk0IDUuMzggMTUuNjggNi4wNyAxNy4wNiA3LjM4TDE5LjQgNS4wM0MxNy40NCAzLjE5IDE0Ljk1IDIgMTIgMkM3Ljg5IDIgNC4zMiA0LjE4IDIuNDIgNy43OUw2LjAyIDEwLjYyQzYuODkgOC4xOCA5LjI0IDYuMzggMTIgNi4zOFY1LjM4WiIgZmlsbD0iI0VBNDMzNSIvPgo8L3N2Zz4=',
      }}
      style={styles.logo}
    />
  </View>
);

export function GoogleSignInButton({
  onPress,
  loading = false,
  disabled = false,
}: GoogleSignInButtonProps) {
  return (
    <Button
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      variant="secondary"
      size="lg"
      fullWidth
      icon={!loading && <GoogleLogo />}
      style={styles.button}
    >
      Continue with Google
    </Button>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.gray[300],
    ...SHADOWS.sm,
  },
  logoContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 20,
    height: 20,
  },
});