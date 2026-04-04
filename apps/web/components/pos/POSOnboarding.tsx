'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Store,
  UtensilsCrossed,
  Scissors,
  Hotel,
  HeartPulse,
  ScissorsLineDashed,
  Wheat,
  MoreHorizontal,
  ShoppingCart,
  ClipboardList,
  Package,
  ArrowRight,
  Check,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  SERVICE_BUSINESS_TYPES,
  PRODUCT_BUSINESS_TYPES,
} from '@/types/business.types';

// ============================================
// TYPES
// ============================================

interface BusinessTypeOption {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'service' | 'product' | 'hybrid';
  description: string;
}

// ============================================
// CONSTANTS
// ============================================

const BUSINESS_TYPE_OPTIONS: BusinessTypeOption[] = [
  {
    value: 'retail',
    label: 'Retail Store',
    icon: Store,
    category: 'product',
    description: 'Sell physical products with inventory tracking',
  },
  {
    value: 'restaurant',
    label: 'Restaurant & Cafe',
    icon: UtensilsCrossed,
    category: 'product',
    description: 'Manage menu items and food products',
  },
  {
    value: 'rice_business',
    label: 'Rice Business',
    icon: Wheat,
    category: 'product',
    description: 'Track rice products and stock levels',
  },
  {
    value: 'salon',
    label: 'Salon & Spa',
    icon: Scissors,
    category: 'service',
    description: 'Manage beauty and wellness services',
  },
  {
    value: 'barbershop',
    label: 'Barber Shop',
    icon: ScissorsLineDashed,
    category: 'service',
    description: 'Manage grooming services and pricing',
  },
  {
    value: 'healthcare',
    label: 'Health Care',
    icon: HeartPulse,
    category: 'service',
    description: 'Manage medical and health services',
  },
  {
    value: 'hotel',
    label: 'Hotel & Travel',
    icon: Hotel,
    category: 'service',
    description: 'Manage hospitality services and bookings',
  },
  {
    value: 'others',
    label: 'Others',
    icon: MoreHorizontal,
    category: 'hybrid',
    description: 'Both products and services',
  },
];

const CATEGORY_INFO = {
  product: {
    label: 'Product-based',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    features: ['Product catalog', 'Inventory & stock tracking', 'SKU management'],
    icon: Package,
  },
  service: {
    label: 'Service-based',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    features: ['Service catalog', 'Duration & pricing', 'Staff assignment'],
    icon: ClipboardList,
  },
  hybrid: {
    label: 'Both',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    features: ['Product & service catalog', 'Inventory tracking', 'Full POS suite'],
    icon: ShoppingCart,
  },
};

// ============================================
// COMPONENT
// ============================================

interface POSOnboardingProps {
  currentBusinessType: string | null;
}

export function POSOnboarding({ currentBusinessType }: POSOnboardingProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string | null>(
    currentBusinessType
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedOption = BUSINESS_TYPE_OPTIONS.find(
    (o) => o.value === selectedType
  );
  const selectedCategory = selectedOption
    ? CATEGORY_INFO[selectedOption.category]
    : null;

  function getCategory(type: string): 'service' | 'product' | 'hybrid' {
    if ((SERVICE_BUSINESS_TYPES as readonly string[]).includes(type))
      return 'service';
    if ((PRODUCT_BUSINESS_TYPES as readonly string[]).includes(type))
      return 'product';
    return 'hybrid';
  }

  async function handleConfirm() {
    if (!selectedType) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/dashboard/pos/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_type: selectedType }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to complete setup');
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong'
      );
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-10rem)] flex items-center justify-center p-4 sm:p-8">
      {/* Background layers */}
      <div className="absolute inset-0 gradient-mesh" />
      <div className="absolute inset-0 dot-pattern opacity-40" />

      <div className="relative max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="relative w-16 h-16 mx-auto mb-6">
            {/* Glow effect behind the icon */}
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl scale-150" />
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary/90 to-primary flex items-center justify-center shadow-lg">
              <ShoppingCart className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 tracking-tight">
            Set Up Your POS
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
            Tell us about your business so we can tailor the perfect point-of-sale
            experience for you. This only takes a moment.
          </p>
        </div>

        {/* Business Type Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mb-6 sm:mb-8">
          {BUSINESS_TYPE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedType === option.value;
            const category = getCategory(option.value);
            const catInfo = CATEGORY_INFO[category];

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedType(option.value)}
                className={cn(
                  'relative flex flex-col items-center gap-1.5 sm:gap-2.5 p-3 sm:p-5 rounded-xl border-2 text-center cursor-pointer',
                  'hover:shadow-lg hover:scale-[1.02] transition-all duration-200',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.3),0_4px_16px_hsl(var(--primary)/0.12)]'
                    : 'border-border/60 bg-background hover:border-border hover:bg-accent/30'
                )}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200',
                    isSelected ? 'bg-primary/10' : 'bg-muted'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-colors duration-200',
                      isSelected ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                </div>
                <span
                  className={cn(
                    'text-sm font-medium transition-colors duration-200',
                    isSelected ? 'text-primary' : 'text-foreground'
                  )}
                >
                  {option.label}
                </span>
                <span
                  className={cn(
                    'text-[10px] px-2.5 py-0.5 rounded-full border font-medium tracking-wide uppercase',
                    catInfo.color
                  )}
                >
                  {catInfo.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Type Preview */}
        {selectedCategory && selectedOption && (
          <div className="bg-background border border-border/60 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border-l-4 border-l-primary/70 shadow-sm">
            <div className="flex items-start gap-3 sm:gap-4">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                  selectedOption.category === 'product'
                    ? 'bg-blue-50'
                    : selectedOption.category === 'service'
                    ? 'bg-purple-50'
                    : 'bg-emerald-50'
                )}
              >
                <selectedCategory.icon
                  className={cn(
                    'w-5 h-5',
                    selectedOption.category === 'product'
                      ? 'text-blue-600'
                      : selectedOption.category === 'service'
                      ? 'text-purple-600'
                      : 'text-emerald-600'
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-2">
                  Your POS will include:
                </h3>
                <ul className="space-y-2">
                  {selectedCategory.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2.5 text-sm text-muted-foreground"
                    >
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm text-destructive text-center mb-4">{error}</p>
        )}

        {/* Confirm Button */}
        <Button
          onClick={handleConfirm}
          disabled={!selectedType || isSubmitting}
          className="w-full h-14 text-base font-semibold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 transition-all duration-200"
          size="lg"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Continue to POS
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground/60 text-center mt-4">
          You can change your business type later in Settings.
        </p>
      </div>
    </div>
  );
}
