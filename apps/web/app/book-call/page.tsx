'use client';

import { InlineWidget } from 'react-calendly';
import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';

const BENEFITS = [
  'Full platform demo',
  'Booking System walkthrough',
  'POS System features',
  'Custom pricing for your business',
  'Implementation timeline',
  'Q&A with our team',
];

export default function BookCallPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#7F0404] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Benefits */}
          <div className="lg:sticky lg:top-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-[#7F0404] mb-4">
              Book a Call with Our Team
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              See how NoxaLoyalty Enterprise can transform your business with
              our Booking System and POS integration
            </p>

            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                What you&apos;ll learn:
              </h2>
              <div className="space-y-3">
                {BENEFITS.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Check className="w-3 h-3 text-yellow-600" />
                    </div>
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm text-gray-500">
              30-minute call &bull; No commitment required
            </p>
          </div>

          {/* Right Side - Calendly Widget */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            <InlineWidget
              url="https://calendly.com/noxa-company/30min"
              styles={{ minWidth: '320px', height: '700px' }}
              pageSettings={{
                primaryColor: '7F0404',
                backgroundColor: 'ffffff',
                hideEventTypeDetails: false,
                hideLandingPageDetails: false,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
