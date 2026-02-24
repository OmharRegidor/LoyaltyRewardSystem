// src/services/notification.service.ts

import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import type { Notification } from '../types/notification.types';

export const notificationService = {
  /**
   * Fetch notifications for a customer, with business name/logo
   */
  async getAll(customerId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*, business:businesses(name, logo_url)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[NotificationService] getAll error:', error.message);
      throw error;
    }

    return (data || []) as Notification[];
  },

  /**
   * Get count of unread notifications
   */
  async getUnreadCount(customerId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customerId)
      .eq('is_read', false);

    if (error) {
      console.error('[NotificationService] getUnreadCount error:', error.message);
      return 0;
    }

    return count ?? 0;
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('[NotificationService] markAsRead error:', error.message);
    }
  },

  /**
   * Mark all unread notifications as read for a customer
   */
  async markAllAsRead(customerId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('customer_id', customerId)
      .eq('is_read', false);

    if (error) {
      console.error('[NotificationService] markAllAsRead error:', error.message);
    }
  },

  /**
   * Register an Expo push token for the current device.
   * No-op in Expo Go — requires a dev client build with native modules.
   */
  async registerPushToken(customerId: string): Promise<string | null> {
    try {
      // These native modules only exist in dev client / standalone builds
      const Device = require('expo-device');
      const Notifications = require('expo-notifications');
      const Constants = require('expo-constants');

      if (!Device.isDevice) {
        console.log('[NotificationService] Push notifications require a physical device');
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[NotificationService] Push notification permission not granted');
        return null;
      }

      const projectId = Constants.default?.expoConfig?.extra?.eas?.projectId
        ?? Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.error('[NotificationService] Missing EAS project ID');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      const token = tokenData.data;

      const { error } = await supabase
        .from('push_tokens')
        .upsert(
          {
            customer_id: customerId,
            token,
            platform: Platform.OS,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'customer_id,token' },
        );

      if (error) {
        console.error('[NotificationService] registerPushToken error:', error.message);
      }

      return token;
    } catch {
      // Expected in Expo Go — native modules not available
      console.log('[NotificationService] Push notifications not available (Expo Go)');
      return null;
    }
  },

  /**
   * Remove push token on sign-out
   */
  async removePushToken(customerId: string, token: string): Promise<void> {
    const { error } = await supabase
      .from('push_tokens')
      .delete()
      .eq('customer_id', customerId)
      .eq('token', token);

    if (error) {
      console.error('[NotificationService] removePushToken error:', error.message);
    }
  },
};
