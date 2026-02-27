// apps/mobile/src/components/PhoneCompletionModal.tsx

import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

interface PhoneCompletionModalProps {
  visible: boolean;
  onSubmit: (phone: string) => Promise<void>;
  onSkip: () => void;
}

export function PhoneCompletionModal({
  visible,
  onSubmit,
  onSkip,
}: PhoneCompletionModalProps) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    const cleaned = phone.replace(/\s+/g, '');
    if (!/^09\d{9}$/.test(cleaned)) {
      setError('Enter a valid 11-digit phone number (e.g. 09171234567)');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(cleaned);
    } catch {
      setError('Failed to save phone number. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [phone, onSubmit]);

  const handleChangeText = useCallback((text: string) => {
    // Only allow digits
    const digits = text.replace(/\D/g, '').slice(0, 11);
    setPhone(digits);
    if (error) setError(null);
  }, [error]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>Add your phone number</Text>
          <Text style={styles.subtitle}>
            This lets you view your loyalty card on the web using your phone
            number and PIN.
          </Text>

          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="09171234567"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            maxLength={11}
            value={phone}
            onChangeText={handleChangeText}
            editable={!isSubmitting}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Save Phone Number</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={onSkip}
            disabled={isSubmitting}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  error: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 6,
  },
  button: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  skipText: {
    color: '#6B7280',
    fontSize: 14,
  },
});
