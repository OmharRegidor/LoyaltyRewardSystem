// src/components/ui/ProgressBar.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../lib/constants';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  backgroundColor?: string;
  fillColor?: string;
  showLabel?: boolean;
  label?: string;
  rightLabel?: string;
}

export function ProgressBar({
  progress,
  height = 8,
  backgroundColor = 'rgba(255,255,255,0.3)',
  fillColor = COLORS.success,
  showLabel = false,
  label,
  rightLabel,
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={styles.container}>
      {(showLabel || label || rightLabel) && (
        <View style={styles.labelContainer}>
          {label && <Text style={styles.label}>{label}</Text>}
          {rightLabel && <Text style={styles.rightLabel}>{rightLabel}</Text>}
        </View>
      )}
      <View style={[styles.track, { height, backgroundColor }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clampedProgress * 100}%`,
              backgroundColor: fillColor,
              height,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.white,
    fontWeight: '500',
  },
  rightLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.white,
    opacity: 0.8,
  },
  track: {
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: BORDER_RADIUS.full,
  },
});