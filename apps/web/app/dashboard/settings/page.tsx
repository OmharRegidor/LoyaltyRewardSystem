// apps/web/app/dashboard/settings/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  Building2,
  Coins,
  Lock,
  Save,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  Calculator,
  Info,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';

// ============================================
// TYPES
// ============================================

interface FormState {
  businessName: string;
  logoUrl: string | null;
  pesosPerPoint: number;
  minPurchase: number;
  maxPointsPerTransaction: string;
  pointsExpiryDays: string;
}

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

// ============================================
// PRESET OPTIONS
// ============================================

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
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [businessId, setBusinessId] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormState>({
    businessName: '',
    logoUrl: null,
    pesosPerPoint: 10,
    minPurchase: 0,
    maxPointsPerTransaction: '',
    pointsExpiryDays: '',
  });

  const [selectedPreset, setSelectedPreset] = useState<number>(10);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [previewAmount, setPreviewAmount] = useState('500');

  // ============================================
  // LOAD SETTINGS
  // ============================================

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: business, error } = await supabase
        .from('businesses')
        .select(
          'id, name, logo_url, pesos_per_point, min_purchase_for_points, max_points_per_transaction, points_expiry_days'
        )
        .eq('owner_id', user.id)
        .single();

      if (error) throw error;

      if (business) {
        setBusinessId(business.id);
        setFormData({
          businessName: business.name || '',
          logoUrl: business.logo_url,
          pesosPerPoint: business.pesos_per_point || 10,
          minPurchase: business.min_purchase_for_points || 0,
          maxPointsPerTransaction:
            business.max_points_per_transaction?.toString() || '',
          pointsExpiryDays: business.points_expiry_days?.toString() || '',
        });

        // Set preset selection
        const matchingPreset = POINTS_RATE_PRESETS.find(
          (p) => p.value === business.pesos_per_point
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
          name: formData.businessName,
          logo_url: formData.logoUrl,
          pesos_per_point: formData.pesosPerPoint,
          min_purchase_for_points: formData.minPurchase,
          max_points_per_transaction: formData.maxPointsPerTransaction
            ? parseInt(formData.maxPointsPerTransaction)
            : null,
          points_expiry_days: formData.pointsExpiryDays
            ? parseInt(formData.pointsExpiryDays)
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
      setFormData((prev) => ({ ...prev, pesosPerPoint: value }));
    }
  };

  const handleCustomRateChange = (value: string) => {
    const numValue = parseInt(value) || 1;
    setFormData((prev) => ({ ...prev, pesosPerPoint: Math.max(1, numValue) }));
  };

  // Calculate preview points
  const calculatePoints = (amount: number): number => {
    if (formData.pesosPerPoint <= 0) return 0;
    let points = Math.floor(amount / formData.pesosPerPoint);

    if (formData.maxPointsPerTransaction) {
      const maxPoints = parseInt(formData.maxPointsPerTransaction);
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
        className="space-y-8 max-w-4xl"
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

        {/* Business Profile */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Business Profile</h2>
                <p className="text-sm text-muted-foreground">
                  Basic information about your business
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Logo */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Business Logo
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-linear-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-2xl">
                      {formData.businessName.charAt(0).toUpperCase() || 'B'}
                    </span>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition text-sm">
                    <Upload className="w-4 h-4" />
                    Upload Logo
                  </button>
                </div>
              </div>

              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      businessName: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition bg-background"
                  placeholder="Enter your business name"
                />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Loyalty Points Settings */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Coins className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Loyalty Points Settings</h2>
                <p className="text-sm text-muted-foreground">
                  Configure how customers earn points
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Points Rate Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Points Earning Rate
                  <span className="text-muted-foreground font-normal ml-2">
                    How much should customers spend to earn 1 point?
                  </span>
                </label>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {POINTS_RATE_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handlePresetChange(preset.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedPreset === preset.value
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <p className="font-semibold text-sm">{preset.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {preset.description}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Custom Input */}
                {showCustomInput && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-xl">
                    <label className="block text-sm font-medium mb-2">
                      Custom Rate
                    </label>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">₱</span>
                      <input
                        type="number"
                        min="1"
                        value={formData.pesosPerPoint}
                        onChange={(e) => handleCustomRateChange(e.target.value)}
                        className="w-24 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition bg-background text-center font-semibold"
                      />
                      <span className="text-muted-foreground">= 1 point</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Preview Calculator */}
              <div className="p-4 bg-linear-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">
                    Points Calculator Preview
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-muted-foreground text-sm">
                    If customer spends
                  </span>
                  <div className="flex items-center">
                    <span className="text-muted-foreground">₱</span>
                    <input
                      type="number"
                      value={previewAmount}
                      onChange={(e) => setPreviewAmount(e.target.value)}
                      className="w-24 px-2 py-1 border border-border rounded-lg bg-background text-center font-semibold ml-1"
                    />
                  </div>
                  <span className="text-muted-foreground text-sm">
                    they earn
                  </span>
                  <span className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold">
                    {calculatePoints(parseFloat(previewAmount) || 0)} points
                  </span>
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Advanced Options
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Minimum Purchase */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Minimum Purchase for Points
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        ₱
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={formData.minPurchase}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            minPurchase: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full pl-8 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition bg-background"
                        placeholder="0"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Customers must spend at least this amount to earn points
                    </p>
                  </div>

                  {/* Max Points Per Transaction */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Max Points Per Transaction
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxPointsPerTransaction}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          maxPointsPerTransaction: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition bg-background"
                      placeholder="No limit"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave empty for unlimited points per transaction
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Security */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Lock className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Security</h2>
                <p className="text-sm text-muted-foreground">
                  Manage your account security
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-muted/50 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-medium">Change Password</p>
                  <p className="text-sm text-muted-foreground">
                    Update your account password
                  </p>
                </div>
                <button className="px-4 py-2 border border-border rounded-lg hover:bg-background transition text-sm font-medium">
                  Change
                </button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div variants={itemVariants} className="sticky bottom-6">
          <Card className="p-4 bg-background/80 backdrop-blur-lg border-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {saveStatus === 'success' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      Settings saved successfully!
                    </span>
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">{errorMessage}</span>
                  </div>
                )}
              </div>

              <button
                onClick={saveSettings}
                disabled={saveStatus === 'saving'}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition font-medium disabled:opacity-50"
              >
                {saveStatus === 'saving' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Settings
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
