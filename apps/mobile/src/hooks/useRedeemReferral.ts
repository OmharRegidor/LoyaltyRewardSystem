// src/hooks/useRedeemReferral.ts

import { useState, useCallback } from 'react';
import { useCustomer } from './useCustomer';
import { referralService } from '../services/referral.service';

// ============================================
// TYPES
// ============================================

type Step = 'idle' | 'previewing' | 'redeeming' | 'success';

interface PreviewInfo {
  code: string;
  businessName: string;
  businessLogoUrl: string | null;
  referrerName: string;
  bonusPoints: number;
}

interface SuccessInfo {
  businessName: string;
  pointsEarned: number;
  businessId: string;
}

// ============================================
// HOOK
// ============================================

export function useRedeemReferral() {
  const { customer, refreshCustomer } = useCustomer();

  const [step, setStep] = useState<Step>('idle');
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState<PreviewInfo | null>(null);
  const [success, setSuccess] = useState<SuccessInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const lookupCode = useCallback(async () => {
    const trimmed = code.trim();
    if (trimmed.length !== 6) {
      setError('Referral code must be 6 characters');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await referralService.lookupReferralCode(trimmed);

      if (!result) {
        setError('Invalid or expired referral code');
        return;
      }

      // Self-referral check
      if (result.customer_id === customer?.id) {
        setError('You cannot use your own referral code');
        return;
      }

      // Max uses check
      if (result.uses >= result.max_uses) {
        setError('This referral code has reached its maximum uses');
        return;
      }

      setPreview({
        code: result.code,
        businessName: result.business?.name || 'Unknown Business',
        businessLogoUrl: result.business?.logo_url || null,
        referrerName: result.referrer?.full_name || 'A friend',
        bonusPoints: result.business?.referral_reward_points || 25,
      });
      setStep('previewing');
    } catch (err) {
      console.error('[useRedeemReferral] lookupCode error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [code, customer?.id]);

  const confirmRedeem = useCallback(async () => {
    if (!customer?.id || !preview) return;

    try {
      setStep('redeeming');
      setError(null);

      const result = await referralService.redeemReferralCode(
        preview.code,
        customer.id,
      );

      if (!result.success) {
        setError(result.error || 'Failed to redeem referral code');
        setStep('previewing');
        return;
      }

      await refreshCustomer();

      setSuccess({
        businessName: preview.businessName,
        pointsEarned: result.invitee_points || preview.bonusPoints,
        businessId: result.business_id || '',
      });
      setStep('success');
    } catch (err) {
      console.error('[useRedeemReferral] confirmRedeem error:', err);
      setError('Something went wrong. Please try again.');
      setStep('previewing');
    }
  }, [customer?.id, preview, refreshCustomer]);

  const cancelPreview = useCallback(() => {
    setStep('idle');
    setPreview(null);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setStep('idle');
    setCode('');
    setPreview(null);
    setSuccess(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    step,
    code,
    setCode,
    preview,
    success,
    error,
    isLoading,
    lookupCode,
    confirmRedeem,
    cancelPreview,
    reset,
  };
}
