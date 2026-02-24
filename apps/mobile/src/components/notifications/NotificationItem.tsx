// src/components/notifications/NotificationItem.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../lib/constants';
import type { Notification } from '../../types/notification.types';

interface NotificationItemProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
}

export function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const businessName = notification.business?.name ?? 'Business';
  const logoUrl = notification.business?.logo_url;
  const initials = businessName.slice(0, 2).toUpperCase();

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
  });

  return (
    <TouchableOpacity
      style={[styles.container, !notification.is_read && styles.unreadContainer]}
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
    >
      {/* Business logo or initials */}
      <View style={styles.logoContainer}>
        {logoUrl ? (
          <Image source={{ uri: logoUrl }} style={styles.logo} />
        ) : (
          <View style={styles.logoFallback}>
            <Text style={styles.logoInitials}>{initials}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[styles.title, !notification.is_read && styles.unreadTitle]}
          numberOfLines={1}
        >
          {notification.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={styles.time}>{timeAgo}</Text>
      </View>

      {/* Unread dot */}
      {!notification.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  unreadContainer: {
    backgroundColor: '#fef9f0',
  },
  logoContainer: {
    marginRight: SPACING.md,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
  },
  logoFallback: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitials: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray[700],
    fontWeight: '400',
    marginBottom: 2,
  },
  unreadTitle: {
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  body: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray[500],
    lineHeight: 18,
  },
  time: {
    fontSize: 11,
    color: COLORS.gray[400],
    marginTop: 4,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
});
