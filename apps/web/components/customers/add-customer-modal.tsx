// apps/web/components/customers/add-customer-modal.tsx

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import {
  Mail,
  Loader2,
  CheckCircle,
  AlertCircle,
  Send,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
}

interface FormData {
  email: string;
}

interface FormErrors {
  email?: string;
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

// ============================================
// VALIDATION
// ============================================

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.email.trim()) {
    errors.email = 'Email is required';
    return errors;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Invalid email address';
  }

  return errors;
}

// ============================================
// COMPONENT
// ============================================

export function AddCustomerModal({
  isOpen,
  onClose,
  businessName,
}: AddCustomerModalProps) {
  const [formData, setFormData] = useState<FormData>({
    email: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const handleInputChange = (value: string) => {
    setFormData({ email: value });
    if (errors.email) {
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitState('submitting');
    setErrors({});

    try {
      const response = await fetch('/api/staff/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      setSubmitMessage(
        data.data.alreadyRegistered
          ? `This customer is already registered with ${businessName}.`
          : `Invitation sent! The customer will receive an email to complete their signup.`,
      );
      setSubmitState('success');
    } catch (error) {
      setSubmitMessage(
        error instanceof Error ? error.message : 'Something went wrong',
      );
      setSubmitState('error');
    }
  };

  const handleClose = () => {
    setFormData({ email: '' });
    setErrors({});
    setSubmitState('idle');
    setSubmitMessage('');
    onClose();
  };

  const handleInviteAnother = () => {
    setFormData({ email: '' });
    setErrors({});
    setSubmitState('idle');
    setSubmitMessage('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Invite Customer
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {submitState === 'success' ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Done!</h3>
              <p className="text-gray-500 text-sm mb-6">
                {submitMessage}
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleInviteAnother}
                  className="flex-1"
                >
                  Invite Another
                </Button>
                <Button onClick={handleClose} className="flex-1">
                  Done
                </Button>
              </div>
            </div>
          ) : submitState === 'error' ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-500 text-sm mb-6">
                {submitMessage}
              </p>
              <Button
                variant="outline"
                onClick={() => setSubmitState('idle')}
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter the customer&apos;s email address. They&apos;ll receive
                an invitation to sign up and verify their identity.
              </p>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="juan@email.com"
                    className={`pl-10 ${
                      errors.email ? 'border-red-500' : ''
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                <p className="text-xs text-primary">
                  The customer will complete their registration on their own device.
                  Their identity will be verified via email OTP.
                </p>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={submitState === 'submitting'}
                className="w-full"
              >
                {submitState === 'submitting' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending Invitation...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
