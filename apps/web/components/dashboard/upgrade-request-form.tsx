'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Crown,
  Upload,
  Loader2,
  CheckCircle,
  XCircle,
  ShoppingCart,
  Users,
  BarChart3,
  Clock,
  ImageIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import Image from 'next/image';

interface UpgradeRequestData {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  screenshot_url: string;
  rejection_reason: string | null;
  created_at: string;
}

type FormStep = 'cta' | 'payment' | 'pending' | 'rejected';

interface UpgradeRequestFormProps {
  onUpgradeSubmitted: () => void;
}

export function UpgradeRequestForm({ onUpgradeSubmitted }: UpgradeRequestFormProps) {
  const [step, setStep] = useState<FormStep>('cta');
  const [existingRequest, setExistingRequest] = useState<UpgradeRequestData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchExistingRequest();
  }, []);

  const fetchExistingRequest = async () => {
    try {
      const res = await fetch('/api/billing/upgrade-request');
      const data = await res.json();
      if (data.request) {
        setExistingRequest(data.request);
        if (data.request.status === 'pending') {
          setStep('pending');
        } else if (data.request.status === 'rejected') {
          setStep('rejected');
        }
      }
    } catch {
      // No existing request, show CTA
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `screenshot-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('upgrade-screenshots')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('upgrade-screenshots')
        .getPublicUrl(fileName);

      setScreenshotUrl(urlData.publicUrl);
      setScreenshotPreview(URL.createObjectURL(file));
    } catch {
      setError('Failed to upload screenshot. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!screenshotUrl) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/billing/upgrade-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screenshotUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit request');
      }

      const data = await res.json();
      setExistingRequest(data.request);
      setStep('pending');
      onUpgradeSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setExistingRequest(null);
    setScreenshotUrl(null);
    setScreenshotPreview(null);
    setError(null);
    setStep('payment');
  };

  // CTA Step
  if (step === 'cta') {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-yellow-500 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Upgrade to Enterprise</h3>
              <p className="text-sm text-gray-600">Unlock all features for your business</p>
            </div>
          </div>

          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-3xl font-bold">&#8369;1,490</span>
            <span className="text-gray-500">/year</span>
            <span className="text-sm text-gray-400 ml-2">(~$25 USD)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
            {[
              { icon: ShoppingCart, label: 'Point-of-Sale System' },
              { icon: Users, label: 'Unlimited Staff' },
              { icon: BarChart3, label: 'Advanced Analytics' },
              { icon: Crown, label: 'Custom Branding' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm">
                <Icon className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep('payment')}
            className="w-full bg-gradient-to-r from-secondary to-yellow-500 hover:from-secondary/90 hover:to-yellow-500/90 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            Subscribe Now
          </button>
        </div>
      </div>
    );
  }

  // Payment Step
  if (step === 'payment') {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="font-bold text-lg">Complete Your Payment</h3>
          <p className="text-sm text-gray-500 mt-1">
            Scan the QR code to pay &#8369;1,490, then upload a screenshot of your payment
          </p>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* QR Code */}
            <div className="flex flex-col items-center">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Scan to Pay
              </p>
              <div className="w-48 h-48 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                <Image
                  src="/cashG.jfif"
                  alt="GCash Payment QR Code"
                  width={192}
                  height={192}
                  className="rounded-xl object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML =
                      '<p class="text-sm text-gray-400 text-center px-4">QR code will be available soon</p>';
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                GCash, Maya, or Bank Transfer
              </p>
            </div>

            {/* Upload Area */}
            <div className="flex flex-col">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Upload Payment Screenshot
              </p>

              {screenshotPreview ? (
                <div className="relative">
                  <img
                    src={screenshotPreview}
                    alt="Payment screenshot"
                    className="w-full h-48 object-cover rounded-xl border border-gray-200"
                  />
                  <button
                    onClick={() => {
                      setScreenshotUrl(null);
                      setScreenshotPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute top-2 right-2 p-1 bg-white/80 rounded-full hover:bg-white transition"
                  >
                    <XCircle className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex-1 min-h-[192px] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-gray-50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                      <span className="text-sm text-gray-500">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        Click to upload screenshot
                      </span>
                      <span className="text-xs text-gray-400">
                        PNG, JPG up to 5MB
                      </span>
                    </>
                  )}
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setStep('cta')}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={!screenshotUrl || submitting}
              className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 px-6 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Submit Payment Proof
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pending Step
  if (step === 'pending') {
    return (
      <div className="bg-blue-50 rounded-2xl border border-blue-200 p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-blue-900">Upgrade Request Submitted</h3>
            <p className="text-sm text-blue-700 mt-1">
              Your payment is being reviewed by our team. This usually takes less than 24 hours.
            </p>
            {existingRequest?.created_at && (
              <p className="text-xs text-blue-500 mt-2">
                Submitted on{' '}
                {new Date(existingRequest.created_at).toLocaleDateString('en-PH', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Rejected Step
  if (step === 'rejected') {
    return (
      <div className="bg-red-50 rounded-2xl border border-red-200 p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-red-900">Upgrade Request Rejected</h3>
            {existingRequest?.rejection_reason && (
              <p className="text-sm text-red-700 mt-1">
                Reason: {existingRequest.rejection_reason}
              </p>
            )}
            <p className="text-sm text-red-600 mt-2">
              You can submit a new request with a valid payment screenshot.
            </p>
            <button
              onClick={handleRetry}
              className="mt-3 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-xl transition text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
