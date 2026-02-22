// src/components/ReferralOnboardingModal.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  Keyboard,
  Platform,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useRedeemReferral } from '../hooks/useRedeemReferral';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  SHADOWS,
} from '../lib/constants';

type ModalStep = 'prompt' | 'input' | 'success';

export function ReferralOnboardingModal() {
  const { isNewCustomer, clearNewCustomerFlag } = useAuth();
  const {
    code,
    setCode,
    preview,
    success,
    error,
    isLoading,
    step: hookStep,
    lookupCode,
    confirmRedeem,
    cancelPreview,
    reset,
  } = useRedeemReferral();

  const [modalStep, setModalStep] = useState<ModalStep>('prompt');
  const keyboardOffset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, (e) => {
      Animated.timing(keyboardOffset, {
        toValue: -e.endCoordinates.height,
        duration: Platform.OS === 'ios' ? e.duration : 250,
        useNativeDriver: true,
      }).start();
    });

    const onHide = Keyboard.addListener(hideEvent, (e) => {
      Animated.timing(keyboardOffset, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? (e.duration ?? 250) : 250,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [keyboardOffset]);

  const dismiss = () => {
    clearNewCustomerFlag();
    reset();
    setModalStep('prompt');
  };

  const handleSkip = () => {
    dismiss();
  };

  const handleYes = () => {
    setModalStep('input');
  };

  const handleCodeChange = (text: string) => {
    setCode(text.toUpperCase().replace(/[^A-Z0-9]/g, ''));
  };

  const handleLookup = async () => {
    await lookupCode();
  };

  const handleConfirm = async () => {
    await confirmRedeem();
    setModalStep('success');
  };

  const handleCancel = () => {
    cancelPreview();
  };

  const handleGetStarted = () => {
    dismiss();
  };

  // Determine what to show based on modalStep + hook state
  const showPreviewing = hookStep === 'previewing' || hookStep === 'redeeming';
  const showSuccess = hookStep === 'success' && success;

  return (
    <Modal
      visible={isNewCustomer}
      animationType="slide"
      transparent
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: keyboardOffset }] },
          ]}
        >
          {/* ===== STEP 1: PROMPT ===== */}
          {modalStep === 'prompt' && (
            <View style={styles.stepContainer}>
              <Text style={styles.emoji}>🎉</Text>
              <Text style={styles.heading}>Welcome to NoxaLoyalty!</Text>
              <Text style={styles.subtitle}>
                Do you have a referral code from a friend?
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleYes}
              >
                <Text style={styles.primaryButtonText}>Yes, I have a code</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleSkip}
              >
                <Text style={styles.secondaryButtonText}>Skip</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ===== STEP 2: INPUT ===== */}
          {modalStep === 'input' && !showSuccess && (
            <View style={styles.stepContainer}>
              {!showPreviewing ? (
                <>
                  <Text style={styles.heading}>Enter Referral Code</Text>
                  <Text style={styles.subtitle}>
                    Type the 6-character code from your friend
                  </Text>
                  <View style={styles.codeInputCard}>
                    <TextInput
                      style={styles.codeInput}
                      value={code}
                      onChangeText={handleCodeChange}
                      placeholder="ABC123"
                      placeholderTextColor={COLORS.gray[300]}
                      autoCapitalize="characters"
                      maxLength={6}
                      autoFocus
                      autoCorrect={false}
                    />
                  </View>

                  {error && (
                    <View style={styles.errorCard}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      (code.length !== 6 || isLoading) &&
                        styles.buttonDisabled,
                    ]}
                    onPress={handleLookup}
                    disabled={code.length !== 6 || isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <Text style={styles.primaryButtonText}>Look Up</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleSkip}
                  >
                    <Text style={styles.secondaryButtonText}>Skip</Text>
                  </TouchableOpacity>
                </>
              ) : (
                // Preview state
                preview && (
                  <>
                    <View style={styles.previewCard}>
                      <View style={styles.previewAvatar}>
                        <Text style={styles.previewAvatarText}>
                          {preview.businessName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.previewBusinessName}>
                        {preview.businessName}
                      </Text>
                      <Text style={styles.previewReferrer}>
                        Referred by {preview.referrerName}
                      </Text>
                      <View style={styles.previewPointsBadge}>
                        <Text style={styles.previewPointsText}>
                          +{preview.bonusPoints} bonus points
                        </Text>
                      </View>
                    </View>

                    {error && (
                      <View style={styles.errorCard}>
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    )}

                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancel}
                        disabled={hookStep === 'redeeming'}
                      >
                        <Text
                          style={[
                            styles.cancelButtonText,
                            hookStep === 'redeeming' && { opacity: 0.4 },
                          ]}
                        >
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.confirmButton,
                          hookStep === 'redeeming' && styles.buttonDisabled,
                        ]}
                        onPress={handleConfirm}
                        disabled={hookStep === 'redeeming'}
                      >
                        {hookStep === 'redeeming' ? (
                          <ActivityIndicator
                            size="small"
                            color={COLORS.white}
                          />
                        ) : (
                          <Text style={styles.confirmButtonText}>Confirm</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                )
              )}
            </View>
          )}

          {/* ===== STEP 3: SUCCESS ===== */}
          {showSuccess && success && (
            <View style={styles.stepContainer}>
              <View style={styles.successCircle}>
                <Text style={styles.successCheckmark}>✓</Text>
              </View>
              <Text style={styles.heading}>Welcome Bonus Earned!</Text>
              <Text style={styles.subtitle}>
                +{success.pointsEarned} points at {success.businessName}
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleGetStarted}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS['2xl'],
    borderTopRightRadius: BORDER_RADIUS['2xl'],
    paddingTop: SPACING.lg,
    paddingBottom: SPACING['2xl'],
    paddingHorizontal: SPACING.lg,
  },
  stepContainer: {
    alignItems: 'center',
  },

  // Typography
  emoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  heading: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZE.base,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },

  // Buttons
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    width: '100%',
    marginBottom: SPACING.md,
  },
  primaryButtonText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '700',
    color: COLORS.white,
  },
  secondaryButton: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    width: '100%',
  },
  secondaryButtonText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.gray[500],
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  // Code input
  codeInputCard: {
    backgroundColor: COLORS.gray[50],
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary + '20',
    borderStyle: 'dashed',
    marginBottom: SPACING.base,
    width: '100%',
  },
  codeInput: {
    fontSize: FONT_SIZE['3xl'],
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 6,
    textAlign: 'center',
    width: '100%',
    padding: 0,
  },

  // Error
  errorCard: {
    backgroundColor: COLORS.error + '10',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.base,
    width: '100%',
  },
  errorText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.error,
    textAlign: 'center',
  },

  // Preview
  previewCard: {
    backgroundColor: COLORS.gray[50],
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.base,
    width: '100%',
    ...SHADOWS.sm,
  },
  previewAvatar: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  previewAvatarText: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '700',
    color: COLORS.white,
  },
  previewBusinessName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  previewReferrer: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray[500],
    marginBottom: SPACING.md,
  },
  previewPointsBadge: {
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  previewPointsText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '700',
    color: COLORS.success,
  },

  // Action row
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gray[300],
  },
  cancelButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.gray[600],
  },
  confirmButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Success
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  successCheckmark: {
    fontSize: FONT_SIZE['3xl'],
    color: COLORS.success,
    fontWeight: '700',
  },
});
