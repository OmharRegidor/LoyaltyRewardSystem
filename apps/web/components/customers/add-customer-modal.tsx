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
  User,
  Mail,
  Phone,
  Calendar,
  Loader2,
  CheckCircle,
  AlertCircle,
  UserPlus,
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
  fullName: string;
  email: string;
  phone: string;
  age: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  age?: string;
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

// ============================================
// VALIDATION
// ============================================

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.fullName.trim()) {
    errors.fullName = 'Name is required';
  } else if (data.fullName.trim().length < 2) {
    errors.fullName = 'Name must be at least 2 characters';
  }

  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Invalid email address';
  }

  if (!data.phone.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!/^[\d\s\-+()]{10,20}$/.test(data.phone)) {
    errors.phone = 'Invalid phone number';
  }

  if (data.age) {
    const ageNum = parseInt(data.age);
    if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
      errors.age = 'Age must be between 13 and 120';
    }
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
    fullName: '',
    email: '',
    phone: '',
    age: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
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
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          age: formData.age ? parseInt(formData.age) : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add customer');
      }

      setIsNewCustomer(data.data.isNewCustomer);
      setSubmitMessage(
        data.data.isNewCustomer
          ? `Customer added successfully! Email sent to ${data.data.customerEmail}.`
          : `Customer already exists. Email re-sent to ${data.data.customerEmail}.`
      );
      setSubmitState('success');
    } catch (error) {
      setSubmitMessage(
        error instanceof Error ? error.message : 'Something went wrong'
      );
      setSubmitState('error');
    }
  };

  const handleClose = () => {
    setFormData({ fullName: '', email: '', phone: '', age: '' });
    setErrors({});
    setSubmitState('idle');
    setSubmitMessage('');
    onClose();
  };

  const handleAddAnother = () => {
    setFormData({ fullName: '', email: '', phone: '', age: '' });
    setErrors({});
    setSubmitState('idle');
    setSubmitMessage('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Add Customer
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
              <h3 className="text-xl font-semibold mb-2">
                {isNewCustomer ? 'Customer Added!' : 'Email Sent!'}
              </h3>
              <p className="text-muted-foreground text-sm mb-6">
                {submitMessage}
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleAddAnother}
                  className="flex-1"
                >
                  Add Another
                </Button>
                <Button onClick={handleClose} className="flex-1">
                  Done
                </Button>
              </div>
            </div>
          ) : submitState === 'error' ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Error</h3>
              <p className="text-muted-foreground text-sm mb-6">
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
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) =>
                      handleInputChange('fullName', e.target.value)
                    }
                    placeholder="Juan Dela Cruz"
                    className={`pl-10 ${
                      errors.fullName ? 'border-destructive' : ''
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-destructive">{errors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="juan@email.com"
                    className={`pl-10 ${
                      errors.email ? 'border-destructive' : ''
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Mobile Number <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="09123456789"
                    className={`pl-10 ${
                      errors.phone ? 'border-destructive' : ''
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone}</p>
                )}
              </div>

              {/* Age */}
              <div className="space-y-2">
                <Label htmlFor="age">
                  Age <span className="text-muted-foreground">(optional)</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    placeholder="25"
                    min="13"
                    max="120"
                    className={`pl-10 ${
                      errors.age ? 'border-destructive' : ''
                    }`}
                  />
                </div>
                {errors.age && (
                  <p className="text-xs text-destructive">{errors.age}</p>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                <p className="text-xs text-primary">
                  📧 Customer will receive an email with their QR code and
                  loyalty card.
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
                    Adding Customer...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Customer & Send Email
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
