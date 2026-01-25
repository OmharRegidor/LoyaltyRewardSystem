// apps/web/components/staff/add-customer-modal.tsx

'use client';

import { useState } from 'react';
import {
  X,
  UserPlus,
  Mail,
  Phone,
  User,
  Calendar,
  Loader2,
  CheckCircle,
  AlertCircle,
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
  } else if (!/^[a-zA-Z\s\-'.]+$/.test(data.fullName)) {
    errors.fullName = 'Name contains invalid characters';
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
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    // Validate
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
          ? `Customer added successfully! A welcome email has been sent to ${data.data.customerEmail}.`
          : `Customer already exists. A reminder email has been sent to ${data.data.customerEmail}.`,
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
    // Reset form
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Add Customer</h2>
              <p className="text-xs text-gray-400">{businessName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {submitState === 'success' ? (
            // Success State
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {isNewCustomer ? 'Customer Added!' : 'Email Sent!'}
              </h3>
              <p className="text-gray-400 text-sm mb-6">{submitMessage}</p>
              <div className="flex gap-3">
                <button
                  onClick={handleAddAnother}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
                >
                  Add Another
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : submitState === 'error' ? (
            // Error State
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Error</h3>
              <p className="text-gray-400 text-sm mb-6">{submitMessage}</p>
              <button
                onClick={() => setSubmitState('idle')}
                className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            // Form State
            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      handleInputChange('fullName', e.target.value)
                    }
                    placeholder="Juan Dela Cruz"
                    className={`w-full pl-10 pr-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 transition-all ${
                      errors.fullName
                        ? 'border-red-500'
                        : 'border-gray-700 focus:border-cyan-500'
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-xs text-red-400">{errors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="juan@email.com"
                    className={`w-full pl-10 pr-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 transition-all ${
                      errors.email
                        ? 'border-red-500'
                        : 'border-gray-700 focus:border-cyan-500'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Mobile Number <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="09123456789"
                    className={`w-full pl-10 pr-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 transition-all ${
                      errors.phone
                        ? 'border-red-500'
                        : 'border-gray-700 focus:border-cyan-500'
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-400">{errors.phone}</p>
                )}
              </div>

              {/* Age (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Age <span className="text-gray-500">(optional)</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    placeholder="25"
                    min="13"
                    max="120"
                    className={`w-full pl-10 pr-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 transition-all ${
                      errors.age
                        ? 'border-red-500'
                        : 'border-gray-700 focus:border-cyan-500'
                    }`}
                  />
                </div>
                {errors.age && (
                  <p className="mt-1 text-xs text-red-400">{errors.age}</p>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
                <p className="text-xs text-cyan-300">
                  📧 Customer will receive an email with their QR code and
                  loyalty card. They can use the same email to log in to the
                  NoxaLoyalty app later.
                </p>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={submitState === 'submitting'}
                className="w-full py-3.5 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitState === 'submitting' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Adding Customer...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Add Customer & Send Email
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
