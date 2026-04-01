// src/hooks/useStampCards.ts

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { stampService } from '../services/stamp.service';
import { supabase } from '../lib/supabase';
import type { StampCard } from '../types/stamp.types';

export function useStampCards() {
  const { customerIds } = useAuth();
  const [stampCards, setStampCards] = useState<StampCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStampCards = useCallback(async () => {
    if (customerIds.length === 0) {
      setStampCards([]);
      setIsLoading(false);
      return;
    }

    try {
      const cards = await stampService.getStampCards(customerIds);
      setStampCards(cards);
    } catch (error) {
      console.error('Error loading stamp cards:', error);
    } finally {
      setIsLoading(false);
    }
  }, [customerIds]);

  useEffect(() => {
    fetchStampCards();
  }, [fetchStampCards]);

  // Realtime subscription for stamp card changes
  useEffect(() => {
    if (customerIds.length === 0) return;

    const channels = customerIds.map((customerId) =>
      supabase
        .channel(`stamp-cards-${customerId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'stamp_cards',
            filter: `customer_id=eq.${customerId}`,
          },
          () => {
            fetchStampCards();
          }
        )
        .subscribe()
    );

    return () => {
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
  }, [customerIds, fetchStampCards]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchStampCards();
  }, [fetchStampCards]);

  return {
    stampCards,
    isLoading,
    refresh,
  };
}
