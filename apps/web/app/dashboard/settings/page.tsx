'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/layout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  Building2,
  Coins,
  Shield,
  Save,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  Calculator,
  Info,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  ChevronRight,
  Camera,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';

// ============================================
// TYPES
// ============================================

interface BusinessProfile {
  businessName: string;
  businessType: string;
  phone: string;
  ownerEmail: string;
  address: string;
  city: string;
  description: string;
  logoUrl: string | null;
}

interface LoyaltySettings {
  pesosPerPoint: number;
  minPurchase: number;
  maxPointsPerTransaction: string;
  pointsExpiryDays: string;
}

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

// ============================================
// CONSTANTS
// ============================================

const BUSINESS_TYPES = [
  { value: 'cafe', label: 'Café' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'retail', label: 'Retail Store' },
  { value: 'gym', label: 'Gym / Fitness' },
  { value: 'spa', label: 'Spa / Wellness' },
  { value: 'salon', label: 'Salon / Barbershop' },
  { value: 'grocery', label: 'Grocery Store' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'other', label: 'Other' },
];

const POINTS_RATE_PRESETS = [
  {
    label: '₱5 = 1 point',
    value: 5,
    description: 'Generous - Great for cafes',
  },
  { label: '₱10 = 1 point', value: 10, description: 'Standard - Most common' },
  { label: '₱20 = 1 point', value: 20, description: 'Balanced - Retail shops' },
  {
    label: '₱50 = 1 point',
    value: 50,
    description: 'Conservative - High-value items',
  },
  {
    label: '₱100 = 1 point',
    value: 100,
    description: 'Premium - Luxury businesses',
  },
  { label: 'Custom', value: 0, description: 'Set your own rate' },
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Business Profile State
  const [profile, setProfile] = useState<BusinessProfile>({
    businessName: '',
    businessType: '',
    phone: '',
    ownerEmail: '',
    address: '',
    city: '',
    description: '',
    logoUrl: null,
  });

  // Loyalty Settings State
  const [loyalty, setLoyalty] = useState<LoyaltySettings>({
    pesosPerPoint: 10,
    minPurchase: 0,
    maxPointsPerTransaction: '',
    pointsExpiryDays: '',
  });

  const [selectedPreset, setSelectedPreset] = useState<number>(10);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [previewAmount, setPreviewAmount] = useState('500');

  const [inputValues, setInputValues] = useState({
    customRate: '10',
    minPurchase: '0',
    previewAmount: '500',
  });

  // ============================================
  // LOAD SETTINGS
  // ============================================

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const supabase = createClient();

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Get business data
      const { data: business, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error) throw error;

      if (business) {
        setBusinessId(business.id);

        // Get user metadata for business_type and phone if not in business table
        const metadata = user.user_metadata || {};

        setProfile({
          businessName: business.name || '',
          businessType: business.business_type || metadata.business_type || '',
          phone: business.phone || metadata.phone || '',
          ownerEmail: user.email || '',
          address: business.address || '',
          city: business.city || '',
          description: business.description || '',
          logoUrl: business.logo_url,
        });

        setInputValues({
          customRate: String(business.pesos_per_point || 10),
          minPurchase: String(business.min_purchase_for_points || 0),
          previewAmount: '500',
        });

        // Set preset selection
        const matchingPreset = POINTS_RATE_PRESETS.find(
          (p) => p.value === business.pesos_per_point,
        );
        if (matchingPreset && matchingPreset.value !== 0) {
          setSelectedPreset(matchingPreset.value);
          setShowCustomInput(false);
        } else {
          setSelectedPreset(0);
          setShowCustomInput(true);
        }
      }
    } catch (error) {
      console.error('Load settings error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // LOGO UPLOAD HANDLER
  // ============================================

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !businessId) return;

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Image must be less than 2MB');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    // Validate file type
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setErrorMessage('Only PNG and JPG images are allowed');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    setSaveStatus('saving');

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${businessId}-logo-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      const logoUrl = urlData.publicUrl;

      // Update business record
      const { error: updateError } = await supabase
        .from('businesses')
        .update({ logo_url: logoUrl })
        .eq('id', businessId);

      if (updateError) throw updateError;

      // Update local state
      setProfile((prev) => ({ ...prev, logoUrl }));
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Logo upload error:', error);
      setErrorMessage('Failed to upload logo. Please try again.');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // ============================================
  // SAVE SETTINGS
  // ============================================

  const saveSettings = async () => {
    if (!businessId) return;

    setSaveStatus('saving');
    setErrorMessage('');

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          name: profile.businessName,
          business_type: profile.businessType,
          phone: profile.phone,
          address: profile.address,
          city: profile.city,
          description: profile.description,
          logo_url: profile.logoUrl,
          pesos_per_point: loyalty.pesosPerPoint,
          min_purchase_for_points: loyalty.minPurchase,
          max_points_per_transaction: loyalty.maxPointsPerTransaction
            ? parseInt(loyalty.maxPointsPerTransaction)
            : null,
          points_expiry_days: loyalty.pointsExpiryDays
            ? parseInt(loyalty.pointsExpiryDays)
            : null,
        })
        .eq('id', businessId);

      if (error) throw error;

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Save settings error:', error);
      setSaveStatus('error');
      setErrorMessage('Failed to save settings. Please try again.');
    }
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handlePresetChange = (value: number) => {
    setSelectedPreset(value);
    if (value === 0) {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
      setLoyalty((prev) => ({ ...prev, pesosPerPoint: value }));
      setInputValues((prev) => ({
        ...prev,
        customRate: String(value),
      }));
    }
  };

  const handleCustomRateChange = (value: string) => {
    // Allow empty string for deletion
    setInputValues((prev) => ({
      ...prev,
      customRate: value,
    }));

    // Only update loyalty state if valid number > 0
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1) {
      setLoyalty((prev) => ({ ...prev, pesosPerPoint: numValue }));
    }
  };

  const handleCustomRateBlur = () => {
    if (!inputValues.customRate || parseInt(inputValues.customRate) < 1) {
      const defaultValue = '1';
      setInputValues((prev) => ({
        ...prev,
        customRate: defaultValue,
      }));
      setLoyalty((prev) => ({
        ...prev,
        pesosPerPoint: 1,
      }));
    }
  };

  const handleMinPurchaseChange = (value: string) => {
    // Allow empty string for deletion
    setInputValues((prev) => ({
      ...prev,
      minPurchase: value,
    }));

    // Update loyalty state with parsed value or 0
    const numValue = parseFloat(value);
    setLoyalty((prev) => ({
      ...prev,
      minPurchase: !isNaN(numValue) && numValue >= 0 ? numValue : 0,
    }));
  };

  const handleMinPurchaseBlur = () => {
    if (!inputValues.minPurchase) {
      setInputValues((prev) => ({
        ...prev,
        minPurchase: '0',
      }));
    }
  };

  const handlePreviewAmountChange = (value: string) => {
    setInputValues((prev) => ({
      ...prev,
      previewAmount: value,
    }));
  };

  const handlePreviewAmountBlur = () => {
    if (!inputValues.previewAmount) {
      setInputValues((prev) => ({
        ...prev,
        previewAmount: '0',
      }));
    }
  };

  const calculatePoints = (amount: number): number => {
    if (loyalty.pesosPerPoint <= 0) return 0;
    let points = Math.floor(amount / loyalty.pesosPerPoint);
    if (loyalty.maxPointsPerTransaction) {
      const maxPoints = parseInt(loyalty.maxPointsPerTransaction);
      points = Math.min(points, maxPoints);
    }
    return points;
  };

  // ============================================
  // ANIMATION VARIANTS
  // ============================================

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <DashboardLayout>
      <motion.div
        className="w-full max-w-4xl mx-auto space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your business profile and loyalty program settings
          </p>
        </motion.div>

        {/* Single Column Layout */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Business Profile</h2>
                <p className="text-sm text-muted-foreground">
                  Your business information
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Logo + Business Name Row */}
              <div className="flex items-start gap-6">
                {/* Logo Upload */}
                <div className="shrink-0">
                  <div className="relative group">
                    <div className="w-24 h-24 bg-linear-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
                      {profile.logoUrl ? (
                        <img
                          src={profile.logoUrl}
                          alt="Logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-3xl">
                          {profile.businessName.charAt(0).toUpperCase() || 'B'}
                        </span>
                      )}
                    </div>
                    <label className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <Camera className="w-6 h-6 text-white" />
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Click to upload
                  </p>
                </div>

                {/* Name & Type */}
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={profile.businessName}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          businessName: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition bg-background"
                      placeholder="Your business name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Business Type
                    </label>
                    <select
                      value={profile.businessType}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          businessType: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition bg-background"
                    >
                      <option value="">Select type</option>
                      {BUSINESS_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Two Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    <Phone className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
                    Phone Number
                  </label>
                  <div className="flex">
                    <span className="px-3 py-2.5 bg-muted border border-r-0 border-border rounded-l-xl text-muted-foreground text-sm">
                      +63
                    </span>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      className="flex-1 px-4 py-2.5 border border-border rounded-r-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition bg-background"
                      placeholder="9123456789"
                    />
                  </div>
                </div>

                {/* Owner Email */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    <Mail className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
                    Owner Email
                  </label>
                  <input
                    type="email"
                    value={profile.ownerEmail}
                    disabled
                    className="w-full px-4 py-2.5 border border-border rounded-xl bg-muted/50 text-muted-foreground cursor-not-allowed text-sm"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    <MapPin className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
                    Address
                  </label>
                  <input
                    type="text"
                    value={profile.address}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition bg-background"
                    placeholder="Street address"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    value={profile.city}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, city: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition bg-background"
                    placeholder="City"
                  />
                </div>
              </div>

              {/* Description - Full Width */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Description
                  <span className="text-muted-foreground font-normal ml-1">
                    (optional)
                  </span>
                </label>
                <textarea
                  value={profile.description}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={2}
                  className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition bg-background resize-none text-sm"
                  placeholder="Brief description of your business..."
                />
              </div>
            </div>
          </Card>

          {/* Loyalty Points Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-amber-500/10 rounded-xl">
                <Coins className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Loyalty Points</h2>
                <p className="text-sm text-muted-foreground">
                  Configure earning rates
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Points Rate Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Points Earning Rate
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {POINTS_RATE_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handlePresetChange(preset.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        selectedPreset === preset.value
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <p className="font-semibold text-sm">{preset.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {preset.description}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Custom Input */}
                {showCustomInput && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">₱</span>
                      <input
                        type="number"
                        min="1"
                        value={inputValues.customRate}
                        onChange={(e) => handleCustomRateChange(e.target.value)}
                        onBlur={handleCustomRateBlur}
                        onFocus={(e) => e.target.select()}
                        className="w-20 px-3 py-2 border border-border rounded-lg bg-background text-center font-semibold"
                        placeholder="1"
                      />
                      <span className="text-muted-foreground">= 1 point</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Preview Calculator */}
              <div className="p-4 bg-linear-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Preview</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">₱</span>
                  <input
                    type="number"
                    value={inputValues.previewAmount}
                    onChange={(e) => handlePreviewAmountChange(e.target.value)}
                    onBlur={handlePreviewAmountBlur}
                    onFocus={(e) => e.target.select()}
                    className="w-20 px-2 py-1 border border-border rounded-lg bg-background text-center font-semibold"
                    placeholder="0"
                  />
                  <span className="text-muted-foreground">=</span>
                  <span className="px-3 py-1 bg-primary text-primary-foreground rounded-lg font-bold">
                    {calculatePoints(
                      parseFloat(inputValues.previewAmount) || 0,
                    )}{' '}
                    pts
                  </span>
                </div>
              </div>

              {/* Advanced Options */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Advanced
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5">
                      Min. Purchase
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        ₱
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={inputValues.minPurchase}
                        onChange={(e) =>
                          handleMinPurchaseChange(e.target.value)
                        }
                        onBlur={handleMinPurchaseBlur}
                        onFocus={(e) => e.target.select()}
                        className="w-full pl-7 pr-3 py-2 border border-border rounded-lg bg-background text-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5">
                      Max Points/Txn
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={loyalty.maxPointsPerTransaction}
                      onChange={(e) =>
                        setLoyalty((prev) => ({
                          ...prev,
                          maxPointsPerTransaction: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                      placeholder="No limit"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Security Card */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-500/10 rounded-xl">
                <Shield className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Security</h2>
                <p className="text-sm text-muted-foreground">
                  Manage account security
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push('/dashboard/settings/security')}
              className="w-full p-4 bg-muted/50 hover:bg-muted rounded-xl flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Change Password</p>
                  <p className="text-sm text-muted-foreground">
                    Update your account password
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </button>
          </Card>
        </div>

        {/* Floating Save Button */}
        <motion.div variants={itemVariants} className="sticky bottom-6 z-10">
          <Card className="p-4 bg-background/95 backdrop-blur-xl border-2 border-border/50 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              {/* Status Messages */}
              <div className="flex-1 min-w-0">
                {saveStatus === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-green-600 dark:text-green-400"
                  >
                    <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">
                      Settings saved successfully!
                    </span>
                  </motion.div>
                )}
                {saveStatus === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-red-600 dark:text-red-400"
                  >
                    <div className="p-1 bg-red-100 dark:bg-red-900/30 rounded-full">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium truncate">
                      {errorMessage}
                    </span>
                  </motion.div>
                )}
                {saveStatus === 'idle' && (
                  <p className="text-sm text-muted-foreground">
                    Make changes and click save to update your settings
                  </p>
                )}
              </div>

              {/* Save Button */}
              <button
                onClick={saveSettings}
                disabled={saveStatus === 'saving'}
                className="flex items-center gap-2 px-8 py-3 bg-linear-to-r from-primary to-primary/80 text-primary-foreground rounded-xl hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all font-semibold disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                {saveStatus === 'saving' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
