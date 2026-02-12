// src/components/ui/Button.tsx

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';

import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../lib/constants';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const sizeStyles: Record<ButtonSize, { height: number; paddingHorizontal: number; fontSize: number }> = {
    sm: { height: 36, paddingHorizontal: SPACING.md, fontSize: FONT_SIZE.sm },
    md: { height: 44, paddingHorizontal: SPACING.lg, fontSize: FONT_SIZE.base },
    lg: { height: 52, paddingHorizontal: SPACING.xl, fontSize: FONT_SIZE.lg },
  };

  const currentSize = sizeStyles[size];

  const renderContent = () => (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? COLORS.white : COLORS.primary}
        />
      ) : (
        <>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text
            style={[
              styles.text,
              { fontSize: currentSize.fontSize },
              variant === 'primary' && styles.textPrimary,
              variant === 'secondary' && styles.textSecondary,
              variant === 'ghost' && styles.textGhost,
              isDisabled && styles.textDisabled,
            ]}
          >
            {children}
          </Text>
        </>
      )}
    </View>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[fullWidth && styles.fullWidth, style]}
      >
        <View
          style={[
            styles.base,
            {
              height: currentSize.height,
              paddingHorizontal: currentSize.paddingHorizontal,
              backgroundColor: isDisabled ? COLORS.gray[300] : COLORS.primary,
            },
            SHADOWS.md,
          ]}
        >
          {renderContent()}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        {
          height: currentSize.height,
          paddingHorizontal: currentSize.paddingHorizontal,
        },
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        isDisabled && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: SPACING.sm,
  },
  text: {
    fontWeight: '600',
  },
  textPrimary: {
    color: COLORS.white,
  },
  textSecondary: {
    color: COLORS.primary,
  },
  textGhost: {
    color: COLORS.gray[700],
  },
  textDisabled: {
    color: COLORS.gray[400],
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    backgroundColor: COLORS.gray[200],
    borderColor: COLORS.gray[300],
  },
  fullWidth: {
    width: '100%',
  },
});