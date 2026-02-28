// src/hooks/useNotifications.ts

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';
import { notificationService } from '../services/notification.service';
import type { Notification } from '../types/notification.types';

export function useNotifications() {
  const { customer } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!customer?.id) return;

    try {
      const [items, count] = await Promise.all([
        notificationService.getAll(customer.id),
        notificationService.getUnreadCount(customer.id),
      ]);
      setNotifications(items);
      setUnreadCount(count);
    } catch (error) {
      console.error('[useNotifications] fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [customer?.id]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription for new/updated notifications
  useEffect(() => {
    if (!customer?.id) return;

    const channel = supabase
      .channel(`notifications-${customer.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `customer_id=eq.${customer.id}`,
        },
        async (payload) => {
          // Fetch the full notification with business join
          const newNotif = payload.new as Notification;
          try {
            const { data } = await supabase
              .from('notifications')
              .select('*, business:businesses(name, logo_url)')
              .eq('id', newNotif.id)
              .single();

            if (data) {
              setNotifications((prev) => [data as Notification, ...prev]);
              setUnreadCount((prev) => prev + 1);
            }
          } catch {
            // Fallback: add without business data
            setNotifications((prev) => [newNotif, ...prev]);
            setUnreadCount((prev) => prev + 1);
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `customer_id=eq.${customer.id}`,
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications((prev) => {
            const next = prev.map((n) =>
              n.id === updated.id ? { ...n, ...updated } : n,
            );
            setUnreadCount(next.filter((n) => !n.is_read).length);
            return next;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customer?.id]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await notificationService.markAsRead(notificationId);
    },
    [],
  );

  const markAllAsRead = useCallback(async () => {
    if (!customer?.id) return;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    await notificationService.markAllAsRead(customer.id);
  }, [customer?.id]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
