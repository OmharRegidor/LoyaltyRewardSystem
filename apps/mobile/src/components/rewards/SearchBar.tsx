// src/components/rewards/SearchBar.tsx

import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../lib/constants';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search rewards...',
}: SearchBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.searchIcon}>
        <SearchIcon />
      </View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray[400]}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
    </View>
  );
}

function SearchIcon() {
  return (
    <View style={styles.iconContainer}>
      <View style={styles.iconCircle} />
      <View style={styles.iconHandle} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.base,
    height: 44,
    paddingHorizontal: SPACING.base,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  iconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.gray[400],
  },
  iconHandle: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 6,
    height: 2,
    backgroundColor: COLORS.gray[400],
    transform: [{ rotate: '45deg' }],
    borderRadius: 1,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray[900],
    paddingVertical: 0,
  },
});
