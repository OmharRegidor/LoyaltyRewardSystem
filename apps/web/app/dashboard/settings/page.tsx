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
  CreditCard,
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
  ChevronDown,
  ChevronUp,
  Camera,
  Users,
  Pencil,
  X,
  Store,
  UtensilsCrossed,
  Scissors,
  Hotel,
  HeartPulse,
  ScissorsLineDashed,
  Wheat,
  MoreHorizontal,
  Lock,
  Stamp,
  Crown,
  RefreshCw,
  Gift,
  ImagePlus,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useSubscription } from '@/hooks/useSubscription';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase';
import type { Database } from '../../../../../packages/shared/types/database';

type BusinessUpdate = Database['public']['Tables']['businesses']['Update'];
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BillingSection } from '@/components/dashboard/billing-section';
import { getStampGridCols, STAMP_CARD_ASPECT } from '@/lib/stamp-grid';
import { AnimatePresence } from 'framer-motion';

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
  coinName: string;
  coinImageUrl: string | null;
}

interface InputValues {
  customRate: string;
  minPurchase: string;
  previewAmount: string;
}

interface EditSnapshot {
  profile: BusinessProfile;
  loyalty: LoyaltySettings;
  referralRewardPoints: number;
  referralInput: string;
  inputValues: InputValues;
  selectedPreset: number;
  showCustomInput: boolean;
  customBusinessType: string;
}

interface Milestone {
  position: number;
  label: string;
}

interface StampTemplate {
  title: string;
  totalStamps: number;
  rewardTitle: string;
  rewardDescription: string;
  rewardImageUrl: string | null;
  minPurchaseAmount: number;
  autoReset: boolean;
  milestones: Milestone[];
}

type LoyaltyMode = 'points' | 'stamps';
type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

// ============================================
// CONSTANTS
// ============================================

const BUSINESS_TYPES = [
  { value: 'retail', label: 'Retail Stores', icon: Store },
  { value: 'restaurant', label: 'Restaurants & Cafés', icon: UtensilsCrossed },
  { value: 'salon', label: 'Salons & Spas', icon: Scissors },
  { value: 'hotel', label: 'Hotels & Travel', icon: Hotel },
  { value: 'healthcare', label: 'Health Care', icon: HeartPulse },
  { value: 'barbershop', label: 'Barber Shop', icon: ScissorsLineDashed },
  { value: 'rice_business', label: 'Rice Business', icon: Wheat },
  { value: 'others', label: 'Others', icon: MoreHorizontal },
];

const KNOWN_BUSINESS_TYPE_VALUES = BUSINESS_TYPES.map((t) => t.value);

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

  // Billing section toggle
  const [billingExpanded, setBillingExpanded] = useState(false);

  // Auto-expand billing and smooth scroll when navigating with ?section=billing
  // Must wait for isLoading to become false so the billing element exists in DOM
  useEffect(() => {
    if (isLoading) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('section') === 'billing') {
      setBillingExpanded(true);
      setTimeout(() => {
        document.getElementById('billing')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 400);
    }
  }, [isLoading]);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [snapshot, setSnapshot] = useState<EditSnapshot | null>(null);

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
  const [customBusinessType, setCustomBusinessType] = useState('');

  // Loyalty Settings State
  const [loyalty, setLoyalty] = useState<LoyaltySettings>({
    pesosPerPoint: 10,
    minPurchase: 0,
    maxPointsPerTransaction: '',
    pointsExpiryDays: '',
    coinName: 'Points',
    coinImageUrl: null,
  });

  // Referral Settings State
  const [referralRewardPoints, setReferralRewardPoints] = useState(25);
  const [referralInput, setReferralInput] = useState('25');

  const [selectedPreset, setSelectedPreset] = useState<number>(10);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [previewAmount, setPreviewAmount] = useState('500');

  const [inputValues, setInputValues] = useState<InputValues>({
    customRate: '10',
    minPurchase: '0',
    previewAmount: '500',
  });

  // Loyalty Mode & Stamp Card State
  const { subscription, isLoading: isSubLoading } = useSubscription();
  const [loyaltyMode, setLoyaltyMode] = useState<LoyaltyMode>('points');
  const [loyaltyActivityCount, setLoyaltyActivityCount] = useState(0);
  const [pendingMode, setPendingMode] = useState<LoyaltyMode | null>(null);
  const [posMode, setPosMode] = useState<'products' | 'services' | 'both'>('both');
  const [posModeLoaded, setPosModeLoaded] = useState(false);
  const [stampTemplate, setStampTemplate] = useState<StampTemplate>({
    title: 'Loyalty Card',
    totalStamps: 10,
    rewardTitle: '',
    rewardDescription: '',
    rewardImageUrl: null,
    minPurchaseAmount: 0,
    autoReset: true,
    milestones: [],
  });
  const [editingMilestone, setEditingMilestone] = useState<number | null>(null);
  const [milestoneInput, setMilestoneInput] = useState('');
  const [stampSaveStatus, setStampSaveStatus] = useState<SaveStatus>('idle');
  const [stampErrorMessage, setStampErrorMessage] = useState('');

  // ============================================
  // INPUT STYLING HELPER
  // ============================================

  const editableStyle = isEditing
    ? 'border-gray-200 bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary'
    : 'border-transparent bg-transparent';

  // ============================================
  // EDIT MODE HANDLERS
  // ============================================

  const startEditing = () => {
    setSnapshot({
      profile: { ...profile },
      loyalty: { ...loyalty },
      referralRewardPoints,
      referralInput,
      inputValues: { ...inputValues },
      selectedPreset,
      showCustomInput,
      customBusinessType,
    });
    setIsEditing(true);
    setSaveStatus('idle');
  };

  const cancelEditing = () => {
    if (snapshot) {
      setProfile(snapshot.profile);
      setLoyalty(snapshot.loyalty);
      setReferralRewardPoints(snapshot.referralRewardPoints);
      setReferralInput(snapshot.referralInput);
      setInputValues(snapshot.inputValues);
      setSelectedPreset(snapshot.selectedPreset);
      setShowCustomInput(snapshot.showCustomInput);
      setCustomBusinessType(snapshot.customBusinessType);
    }
    setIsEditing(false);
    setSnapshot(null);
    setSaveStatus('idle');
  };

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

        // Load loyalty mode from business
        const mode = (business as Record<string, unknown>).loyalty_mode as LoyaltyMode | undefined;
        if (mode === 'stamps' || mode === 'points') {
          setLoyaltyMode(mode);
        }

        // Load POS mode
        const bizAny = business as Record<string, unknown>;
        const loadedPosMode = bizAny.pos_mode as string | undefined;
        if (loadedPosMode === 'products' || loadedPosMode === 'services' || loadedPosMode === 'both') {
          setPosMode(loadedPosMode);
        }
        setPosModeLoaded(true);

        // Check how many customers have loyalty activity (for confirmation dialog)
        const currentMode = mode || 'points';
        if (currentMode === 'stamps') {
          const { count: stampCount } = await supabase
            .from('stamp_cards')
            .select('id', { count: 'exact', head: true })
            .eq('business_id', business.id);
          setLoyaltyActivityCount(stampCount ?? 0);
        } else {
          const { count: pointsCount } = await supabase
            .from('customer_businesses')
            .select('id', { count: 'exact', head: true })
            .eq('business_id', business.id)
            .gt('points', 0);
          setLoyaltyActivityCount(pointsCount ?? 0);
        }

        // Get user metadata for business_type and phone if not in business table
        const metadata = user.user_metadata || {};

        // Strip country code (+63 or 63) from phone so the input only shows the local number
        const rawPhone = business.phone || metadata.phone || '';
        const cleanPhone = rawPhone.replace(/^\+?63/, '');

        const loadedType = business.business_type || metadata.business_type || '';
        const isKnownType = KNOWN_BUSINESS_TYPE_VALUES.includes(loadedType);

        setProfile({
          businessName: business.name || '',
          businessType: isKnownType ? loadedType : (loadedType ? 'others' : ''),
          phone: cleanPhone,
          ownerEmail: user.email || '',
          address: business.address || '',
          city: business.city || '',
          description: business.description || '',
          logoUrl: business.logo_url,
        });

        if (!isKnownType && loadedType) {
          setCustomBusinessType(loadedType);
        }

        // Backfill missing fields from auth metadata for existing accounts
        if (!business.business_type || !business.phone || !business.owner_email) {
          const updates: BusinessUpdate = {};
          if (!business.business_type && metadata.business_type) updates.business_type = metadata.business_type;
          if (!business.phone && metadata.phone) updates.phone = metadata.phone;
          if (!business.owner_email && user.email) updates.owner_email = user.email;

          if (Object.keys(updates).length > 0) {
            await supabase.from('businesses').update(updates).eq('id', business.id);
          }
        }

        const referralPts = (business as Record<string, unknown>).referral_reward_points as number ?? 25;
        setReferralRewardPoints(referralPts);
        setReferralInput(String(referralPts));

        setInputValues({
          customRate: String(business.pesos_per_point || 10),
          minPurchase: String(business.min_purchase_for_points || 0),
          previewAmount: '500',
        });

        setLoyalty({
          pesosPerPoint: business.pesos_per_point || 10,
          minPurchase: business.min_purchase_for_points || 0,
          maxPointsPerTransaction: business.max_points_per_transaction
            ? String(business.max_points_per_transaction)
            : '',
          pointsExpiryDays: (business as Record<string, unknown>).points_expiry_days
            ? String((business as Record<string, unknown>).points_expiry_days)
            : '',
          coinName: business.coin_name || 'Points',
          coinImageUrl: business.coin_image_url || null,
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
  // LOAD STAMP TEMPLATE
  // ============================================

  useEffect(() => {
    if (!businessId) return;
    loadStampTemplate();
  }, [businessId]);

  const loadStampTemplate = async () => {
    try {
      const res = await fetch('/api/dashboard/stamp-template');
      if (!res.ok) return;
      const data = await res.json();
      if (data.template) {
        setStampTemplate({
          title: data.template.title || 'Loyalty Card',
          totalStamps: data.template.total_stamps || 10,
          rewardTitle: data.template.reward_title || '',
          rewardDescription: data.template.reward_description || '',
          rewardImageUrl: data.template.reward_image_url || null,
          minPurchaseAmount: data.template.min_purchase_amount || 0,
          autoReset: data.template.auto_reset !== false,
          milestones: Array.isArray(data.template.milestones) ? data.template.milestones : [],
        });
      }
    } catch (err) {
      console.error('Failed to load stamp template:', err);
    }
  };

  // ============================================
  // SAVE STAMP TEMPLATE
  // ============================================

  const saveStampTemplate = async () => {
    if (!businessId) return;

    setStampSaveStatus('saving');
    setStampErrorMessage('');

    try {
      // Validate
      if (!stampTemplate.rewardTitle.trim()) {
        throw new Error('Reward title is required');
      }
      if (stampTemplate.totalStamps < 1 || stampTemplate.totalStamps > 50) {
        throw new Error('Total stamps must be between 1 and 50');
      }

      const res = await fetch('/api/dashboard/stamp-template', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: stampTemplate.title,
          totalStamps: stampTemplate.totalStamps,
          rewardTitle: stampTemplate.rewardTitle,
          rewardDescription: stampTemplate.rewardDescription || null,
          rewardImageUrl: stampTemplate.rewardImageUrl,
          minPurchaseAmount: stampTemplate.minPurchaseAmount,
          autoReset: stampTemplate.autoReset,
          milestones: stampTemplate.milestones,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save template');
      }

      setStampSaveStatus('success');
      setTimeout(() => setStampSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Save stamp template error:', err);
      setStampErrorMessage(err instanceof Error ? err.message : 'Failed to save template');
      setStampSaveStatus('error');
      setTimeout(() => setStampSaveStatus('idle'), 5000);
    }
  };

  // ============================================
  // SAVE LOYALTY MODE
  // ============================================

  const saveLoyaltyMode = async (mode: LoyaltyMode) => {
    if (!businessId) return;

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ loyalty_mode: mode })
        .eq('id', businessId);

      if (error) throw error;
      setLoyaltyMode(mode);
      // Update activity count for the new mode
      if (mode === 'stamps') {
        const { count } = await supabase
          .from('stamp_cards')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId);
        setLoyaltyActivityCount(count ?? 0);
      } else {
        const { count } = await supabase
          .from('customer_businesses')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .gt('points', 0);
        setLoyaltyActivityCount(count ?? 0);
      }
    } catch (err) {
      console.error('Failed to save loyalty mode:', err);
    }
  };

  const handleModeSwitch = (mode: LoyaltyMode) => {
    if (mode === loyaltyMode) return;
    if (loyaltyActivityCount > 0) {
      setPendingMode(mode);
    } else {
      saveLoyaltyMode(mode);
    }
  };

  // ============================================
  // REWARD IMAGE UPLOAD HANDLER
  // ============================================

  const handleRewardImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !businessId) return;

    if (file.size > 2 * 1024 * 1024) {
      setStampErrorMessage('Image must be less than 2MB');
      setStampSaveStatus('error');
      setTimeout(() => setStampSaveStatus('idle'), 3000);
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      setStampErrorMessage('Only PNG, JPG and WebP images are allowed');
      setStampSaveStatus('error');
      setTimeout(() => setStampSaveStatus('idle'), 3000);
      return;
    }

    setStampSaveStatus('saving');

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${businessId}-reward-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      const rewardImageUrl = urlData.publicUrl;
      setStampTemplate((prev) => ({ ...prev, rewardImageUrl }));
      setStampSaveStatus('success');
      setTimeout(() => setStampSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Reward image upload error:', err);
      setStampErrorMessage('Failed to upload image. Please try again.');
      setStampSaveStatus('error');
      setTimeout(() => setStampSaveStatus('idle'), 3000);
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
  // COIN IMAGE UPLOAD HANDLER
  // ============================================

  const handleCoinImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !businessId) return;

    if (file.size > 1 * 1024 * 1024) {
      setErrorMessage('Coin image must be less than 1MB');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      setErrorMessage('Only PNG, JPG and WebP images are allowed');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    setSaveStatus('saving');

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${businessId}-coin-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      const coinImageUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('businesses')
        .update({ coin_image_url: coinImageUrl })
        .eq('id', businessId);

      if (updateError) throw updateError;

      setLoyalty((prev) => ({ ...prev, coinImageUrl }));
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Coin image upload error:', error);
      setErrorMessage('Failed to upload coin image. Please try again.');
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
          business_type: profile.businessType === 'others' ? customBusinessType.trim() : profile.businessType,
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
          referral_reward_points: referralRewardPoints,
          coin_name: loyalty.coinName.trim() || 'Points',
          loyalty_mode: loyaltyMode,
        })
        .eq('id', businessId);

      if (error) throw error;

      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
        setIsEditing(false);
        setSnapshot(null);
      }, 2000);
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
    if (!isEditing) return;
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
        <div className="w-full max-w-4xl mx-auto space-y-5 sm:space-y-6 overflow-hidden">
          {/* Header skeleton */}
          <div>
            <Skeleton className="h-8 w-32 rounded-lg" />
            <Skeleton className="h-5 w-72 mt-1.5 rounded-lg" />
          </div>

          {/* Business Profile card skeleton */}
          <Card className="p-4 sm:p-6 shadow-card border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div>
                <Skeleton className="h-6 w-40 rounded-lg" />
                <Skeleton className="h-4 w-48 mt-1 rounded-lg" />
              </div>
            </div>
            <div className="flex items-start gap-6">
              <Skeleton className="w-24 h-24 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-4">
                <div>
                  <Skeleton className="h-3 w-28 mb-2 rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
                <div>
                  <Skeleton className="h-3 w-28 mb-2 rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <Skeleton className="h-3 w-28 mb-2 rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ))}
            </div>
          </Card>

          {/* Loyalty card skeleton */}
          <Card className="p-4 sm:p-6 shadow-card border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div>
                <Skeleton className="h-6 w-36 rounded-lg" />
                <Skeleton className="h-4 w-44 mt-1 rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          </Card>

          {/* Referral card skeleton */}
          <Card className="p-4 sm:p-6 shadow-card border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div>
                <Skeleton className="h-6 w-40 rounded-lg" />
                <Skeleton className="h-4 w-56 mt-1 rounded-lg" />
              </div>
            </div>
            <Skeleton className="h-10 w-32 rounded-xl" />
          </Card>

          {/* Security card skeleton */}
          <Card className="p-4 sm:p-6 shadow-card border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div>
                <Skeleton className="h-6 w-24 rounded-lg" />
                <Skeleton className="h-4 w-44 mt-1 rounded-lg" />
              </div>
            </div>
            <Skeleton className="h-16 w-full rounded-xl" />
          </Card>
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
        className="w-full max-w-4xl mx-auto space-y-5 sm:space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Manage your business profile and loyalty program
            </p>
          </div>
          {!isEditing ? (
            <button
              onClick={startEditing}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-muted-foreground bg-muted hover:bg-muted/80 rounded-xl transition-all self-start sm:self-auto"
            >
              <Pencil className="w-4 h-4" />
              <span>Edit</span>
            </button>
          ) : (
            <button
              onClick={cancelEditing}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all self-start sm:self-auto"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          )}
        </motion.div>

        {/* Single Column Layout */}
        <div className="space-y-5 sm:space-y-6">
          {/* Business Profile */}
          <Card className="p-4 sm:p-6 shadow-card border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-gradient-to-br from-primary/15 to-primary/5 rounded-xl">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">Business Profile</h2>
                <p className="text-sm text-muted-foreground">
                  Your business information
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Logo + Business Name Row */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
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
                    {isEditing && (
                      <label className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <Camera className="w-6 h-6 text-white" />
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  {isEditing && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Click to upload
                    </p>
                  )}
                </div>

                {/* Name & Type */}
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={profile.businessName}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          businessName: e.target.value,
                        }))
                      }
                      className={`w-full px-4 py-2.5 border rounded-xl transition ${editableStyle} disabled:opacity-100 disabled:cursor-default`}
                      placeholder="Your business name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Business Type
                    </label>
                    <Select
                      value={profile.businessType}
                      disabled={!isEditing}
                      onValueChange={(value) => {
                        setProfile((prev) => ({
                          ...prev,
                          businessType: value,
                        }));
                        if (value !== 'others') {
                          setCustomBusinessType('');
                        }
                      }}
                    >
                      <SelectTrigger className={`w-full px-4 py-2.5 h-auto border rounded-xl transition ${editableStyle} disabled:opacity-100 disabled:cursor-default [&>svg]:opacity-${isEditing ? '50' : '0'}`}>
                        <SelectValue placeholder="Select type">
                          {profile.businessType && (() => {
                            const selected = BUSINESS_TYPES.find(t => t.value === profile.businessType);
                            if (!selected) return 'Select type';
                            if (selected.value === 'others' && customBusinessType) {
                              return (
                                <span className="flex items-center gap-2">
                                  {customBusinessType}
                                </span>
                              );
                            }
                            const Icon = selected.icon;
                            return (
                              <span className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-muted-foreground" />
                                {selected.label}
                              </span>
                            );
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl p-1">
                        {BUSINESS_TYPES.map((type) => {
                          const Icon = type.icon;
                          return (
                            <SelectItem
                              key={type.value}
                              value={type.value}
                              className="rounded-lg px-3 py-2.5 cursor-pointer"
                            >
                              <span className="flex items-center gap-2.5">
                                <Icon className="w-4 h-4 text-muted-foreground" />
                                {type.label}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {profile.businessType === 'others' && isEditing && (
                      <input
                        type="text"
                        value={customBusinessType}
                        onChange={(e) => setCustomBusinessType(e.target.value)}
                        className={`w-full mt-2 px-4 py-2.5 border rounded-xl transition ${editableStyle}`}
                        placeholder="Please specify your business type"
                        maxLength={100}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Two Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    <Phone className="w-3.5 h-3.5 inline mr-1.5" />
                    Phone Number
                  </label>
                  <div className="flex">
                    <span className={`px-3 py-2.5 bg-muted border border-r-0 rounded-l-xl text-muted-foreground text-sm ${isEditing ? 'border-gray-200' : 'border-transparent bg-transparent'}`}>
                      +63
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={profile.phone}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          phone: e.target.value.replace(/\D/g, ''),
                        }))
                      }
                      onKeyDown={(e) => {
                        if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
                        if (!/^\d$/.test(e.key)) e.preventDefault();
                      }}
                      className={`flex-1 px-4 py-2.5 border rounded-r-xl transition ${editableStyle} disabled:opacity-100 disabled:cursor-default`}
                      placeholder="9123456789"
                    />
                  </div>
                </div>

                {/* Owner Email */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    <Mail className="w-3.5 h-3.5 inline mr-1.5" />
                    Owner Email
                  </label>
                  <input
                    type="email"
                    value={profile.ownerEmail}
                    disabled
                    className="w-full px-4 py-2.5 border border-border/50 rounded-xl bg-muted/50 text-muted-foreground cursor-not-allowed text-sm"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    <MapPin className="w-3.5 h-3.5 inline mr-1.5" />
                    Address
                  </label>
                  <input
                    type="text"
                    value={profile.address}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    className={`w-full px-4 py-2.5 border rounded-xl transition ${editableStyle} disabled:opacity-100 disabled:cursor-default`}
                    placeholder="Street address"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={profile.city}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, city: e.target.value }))
                    }
                    className={`w-full px-4 py-2.5 border rounded-xl transition ${editableStyle} disabled:opacity-100 disabled:cursor-default`}
                    placeholder="City"
                  />
                </div>
              </div>

              {/* Description - Full Width */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Description
                  <span className="font-normal ml-1 normal-case tracking-normal">
                    (optional)
                  </span>
                </label>
                <textarea
                  value={profile.description}
                  disabled={!isEditing}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={2}
                  className={`w-full px-4 py-2.5 border rounded-xl transition resize-none text-sm ${editableStyle} disabled:opacity-100 disabled:cursor-default`}
                  placeholder="Brief description of your business..."
                />
              </div>
            </div>
          </Card>

          {/* POS Mode — shown when POS is enabled */}
          {!isSubLoading && subscription?.plan?.hasPOS && posModeLoaded && (
            <Card className="p-4 sm:p-6 shadow-card border border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
                  <Store className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">POS Catalog Mode</h2>
                  <p className="text-sm text-muted-foreground">
                    What does your POS sell?
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                This only controls what appears in your POS. Your data is never deleted — switching back restores everything.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'products' as const, label: 'Products Only', desc: 'Food, drinks, goods' },
                  { value: 'services' as const, label: 'Services Only', desc: 'Haircuts, bookings' },
                  { value: 'both' as const, label: 'Both', desc: 'Products & services' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={async () => {
                      setPosMode(opt.value);
                      const supabase = createClient();
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) return;
                      const { data: biz } = await supabase.from('businesses').select('id').eq('owner_id', user.id).single();
                      if (!biz) return;
                      await fetch('/api/dashboard/pos/business-type', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pos_mode: opt.value }),
                      }).catch(() => {
                        // Fallback: direct update
                        (supabase as unknown as { from: (t: string) => { update: (d: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<unknown> } } })
                          .from('businesses')
                          .update({ pos_mode: opt.value })
                          .eq('id', biz.id);
                      });
                    }}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      posMode === opt.value
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                    <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Loyalty Program Type */}
          <Card className="p-4 sm:p-6 shadow-card border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-gradient-to-br from-violet-100 to-violet-50 rounded-xl">
                <Gift className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">Loyalty Program Type</h2>
                <p className="text-sm text-muted-foreground">
                  Choose how customers earn rewards
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Points System Option */}
              <button
                type="button"
                onClick={() => handleModeSwitch('points')}
                className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                  loyaltyMode === 'points'
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-50 rounded-lg">
                    <Coins className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Points System</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Customers earn points per peso spent and redeem them for rewards
                </p>
                {loyaltyMode === 'points' && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                )}
              </button>

              {/* Stamp Card Option */}
              {isSubLoading ? (
                <div className="relative p-4 rounded-xl border-2 border-gray-200 animate-pulse">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Stamp className="w-5 h-5 text-gray-300" />
                    </div>
                    <div className="h-5 w-24 bg-gray-200 rounded" />
                  </div>
                  <div className="h-3 w-48 bg-gray-100 rounded" />
                </div>
              ) : subscription?.plan?.hasStampCard ? (
                <button
                  type="button"
                  onClick={() => handleModeSwitch('stamps')}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    loyaltyMode === 'stamps'
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-br from-violet-100 to-violet-50 rounded-lg">
                      <Stamp className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Stamp Card</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Customers collect stamps per visit and earn a reward when the card is full
                  </p>
                  {loyaltyMode === 'stamps' && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle className="w-5 h-5 text-primary" />
                    </div>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setBillingExpanded(true);
                    setTimeout(() => {
                      document.getElementById('billing')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 400);
                  }}
                  className="relative p-4 rounded-xl border-2 border-dashed border-gray-300 text-left transition-all hover:border-violet-300 hover:bg-violet-50/30"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-muted-foreground">Stamp Card</p>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-violet-100 text-violet-700 rounded-full">
                        <Crown className="w-3 h-3" />
                        Enterprise
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground/70">
                    Collect stamps per visit and earn a reward when the card is full
                  </p>
                </button>
              )}
            </div>
          </Card>

          {/* Stamp Card Configuration - shown when stamps mode is active and enterprise */}
          {loyaltyMode === 'stamps' && !isSubLoading && subscription?.plan?.hasStampCard && (
            <Card className="p-4 sm:p-6 shadow-card border border-border/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-gradient-to-br from-violet-100 to-violet-50 rounded-xl">
                  <Gift className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">Stamp Card Settings</h2>
                  <p className="text-sm text-muted-foreground">
                    Configure your digital stamp card
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Card Title */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Card Title
                  </label>
                  <input
                    type="text"
                    maxLength={50}
                    value={stampTemplate.title}
                    onChange={(e) =>
                      setStampTemplate((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl transition focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Loyalty Card"
                  />
                </div>

                {/* Total Stamps */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Total Stamps to Complete
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Number of stamps needed to earn the reward (1–50)
                  </p>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={stampTemplate.totalStamps === 0 ? '' : stampTemplate.totalStamps}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '') {
                        setStampTemplate((prev) => ({ ...prev, totalStamps: 0 }));
                        return;
                      }
                      const val = parseInt(raw);
                      if (!isNaN(val)) {
                        const clamped = Math.min(50, Math.max(0, val));
                        setStampTemplate((prev) => ({
                          ...prev,
                          totalStamps: clamped,
                          // Remove milestones beyond the new total
                          milestones: prev.milestones.filter(m => m.position < clamped),
                        }));
                      }
                    }}
                    onBlur={() => {
                      if (stampTemplate.totalStamps < 1) {
                        setStampTemplate((prev) => ({ ...prev, totalStamps: 1 }));
                      }
                    }}
                    className="w-32 px-4 py-2.5 border border-gray-200 rounded-xl transition text-center font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <span className="ml-2 text-sm text-muted-foreground">stamps</span>
                </div>

                {/* Reward Title */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Reward Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={stampTemplate.rewardTitle}
                    onChange={(e) =>
                      setStampTemplate((prev) => ({ ...prev, rewardTitle: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl transition focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="e.g. Free Item, 20% Off, Free Drink"
                  />
                </div>

                {/* Reward Image */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Reward Image
                    <span className="font-normal ml-1 normal-case tracking-normal">(optional)</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="relative w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary flex items-center justify-center overflow-hidden cursor-pointer transition">
                      {stampTemplate.rewardImageUrl ? (
                        <img
                          src={stampTemplate.rewardImageUrl}
                          alt="Reward"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImagePlus className="w-6 h-6 text-muted-foreground/60" />
                      )}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleRewardImageUpload}
                      />
                    </label>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>PNG, JPG or WebP</p>
                      <p>Max 2MB</p>
                    </div>
                  </div>
                </div>

                {/* Min Purchase Amount */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Minimum Purchase Amount
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Minimum spend required per visit to earn a stamp
                  </p>
                  <div className="relative w-40">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      ₱
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={stampTemplate.minPurchaseAmount === 0 ? '' : stampTemplate.minPurchaseAmount}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === '') {
                          setStampTemplate((prev) => ({ ...prev, minPurchaseAmount: 0 }));
                          return;
                        }
                        const val = parseFloat(raw);
                        if (!isNaN(val) && val >= 0) {
                          setStampTemplate((prev) => ({ ...prev, minPurchaseAmount: val }));
                        }
                      }}
                      className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl transition focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Auto-restart toggle */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Auto-restart</p>
                      <p className="text-xs text-muted-foreground">
                        Start new card after redemption
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={stampTemplate.autoReset}
                    onCheckedChange={(checked) =>
                      setStampTemplate((prev) => ({ ...prev, autoReset: checked }))
                    }
                  />
                </div>

                {/* Card Preview — realistic mobile card replica */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-violet-700">
                    Card Preview
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This is how your customers will see the stamp card on their phone.
                  </p>

                  {(() => {
                    const cols = getStampGridCols(stampTemplate.totalStamps);
                    const rows = Math.ceil(stampTemplate.totalStamps / cols);
                    const gap = stampTemplate.totalStamps > 30 ? '4px' : stampTemplate.totalStamps > 15 ? '5px' : '6px';
                    return (
                      <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        {/* BACK — Stamp Grid (default view) */}
                        <div
                          className="flex-1 rounded-2xl border border-amber-200/80 shadow-lg overflow-hidden"
                          style={{ aspectRatio: `${STAMP_CARD_ASPECT}` }}
                        >
                          <div className="h-full bg-gradient-to-br from-amber-50 via-orange-50/80 to-yellow-50 p-4 flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between shrink-0 pb-1">
                              <span className="text-sm font-bold text-gray-800">
                                3/{stampTemplate.totalStamps} stamps
                              </span>
                              <span className="text-[9px] font-semibold text-amber-600/50 uppercase tracking-wider">
                                Stamp Side
                              </span>
                            </div>

                            {/* Stamp grid — clickable for milestones */}
                            <div
                              className="flex-1 grid min-h-0 place-items-center"
                              style={{
                                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                                gridTemplateRows: `repeat(${rows}, 1fr)`,
                                gap,
                              }}
                            >
                              {Array.from({ length: stampTemplate.totalStamps }).map((_, i) => {
                                const position = i + 1;
                                const isFilled = i < 3;
                                const isLast = i === stampTemplate.totalStamps - 1;
                                const milestone = stampTemplate.milestones.find(m => m.position === position);
                                const isMilestone = !!milestone;
                                const isEditing = editingMilestone === position;

                                return (
                                  <div
                                    key={i}
                                    onClick={() => {
                                      if (isLast) return; // Last stamp is always the final reward
                                      if (isMilestone) {
                                        // Remove milestone
                                        setStampTemplate(prev => ({
                                          ...prev,
                                          milestones: prev.milestones.filter(m => m.position !== position),
                                        }));
                                        setEditingMilestone(null);
                                      } else {
                                        // Start editing new milestone
                                        setEditingMilestone(position);
                                        setMilestoneInput('');
                                      }
                                    }}
                                    className={`w-full h-full max-h-16 max-w-16 rounded-sm border-[1.5px] flex items-center justify-center font-bold transition-all cursor-pointer relative ${
                                      isMilestone
                                        ? 'border-amber-400 bg-amber-50 text-amber-700 border-dashed hover:border-amber-500'
                                        : isFilled
                                          ? 'border-primary bg-primary text-white shadow-sm hover:opacity-90'
                                          : isLast
                                            ? 'border-orange-400 bg-orange-50 text-orange-500 border-dashed'
                                            : 'border-stone-200/80 bg-white/60 text-stone-300 hover:border-violet-300 hover:bg-violet-50/30'
                                    }`}
                                    title={isLast ? 'Final reward' : isMilestone ? `Click to remove: ${milestone.label}` : 'Click to add milestone reward'}
                                  >
                                    {isEditing ? (
                                      <form
                                        className="absolute inset-0 z-10 flex items-center justify-center p-0.5"
                                        onSubmit={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          if (milestoneInput.trim()) {
                                            setStampTemplate(prev => ({
                                              ...prev,
                                              milestones: [...prev.milestones, { position, label: milestoneInput.trim().slice(0, 20) }],
                                            }));
                                          }
                                          setEditingMilestone(null);
                                        }}
                                      >
                                        <input
                                          autoFocus
                                          value={milestoneInput}
                                          onChange={(e) => setMilestoneInput(e.target.value)}
                                          onBlur={() => setEditingMilestone(null)}
                                          onClick={(e) => e.stopPropagation()}
                                          placeholder="50% OFF"
                                          maxLength={20}
                                          className="w-full h-full text-center text-[8px] font-bold bg-amber-100 border border-amber-400 rounded-md outline-none focus:ring-1 focus:ring-amber-500 px-0.5"
                                        />
                                      </form>
                                    ) : isMilestone ? (
                                      <span className="text-[7px] leading-tight text-center break-words overflow-hidden px-0.5">
                                        {milestone.label}
                                      </span>
                                    ) : isLast ? (
                                      <span className="text-[9px]">FREE</span>
                                    ) : (
                                      <Stamp className="w-[40%] h-[40%]" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Milestone hint */}
                            {stampTemplate.milestones.length === 0 && (
                              <p className="text-[9px] text-amber-600/60 text-center shrink-0">
                                Click any stamp to add a milestone reward
                              </p>
                            )}

                            {/* Footer */}
                            <div className="flex items-center gap-2 shrink-0 pt-1">
                              {stampTemplate.rewardImageUrl && (
                                <img
                                  src={stampTemplate.rewardImageUrl}
                                  alt=""
                                  className="w-5 h-5 rounded object-cover shrink-0"
                                />
                              )}
                              <p className="text-[11px] font-semibold text-gray-500 truncate">
                                {stampTemplate.rewardTitle
                                  ? `${stampTemplate.totalStamps - 3} more → ${stampTemplate.rewardTitle}`
                                  : 'Set a reward title'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* FRONT — Branding side */}
                        <div
                          className="flex-1 rounded-2xl shadow-lg relative overflow-hidden"
                          style={{
                            aspectRatio: `${STAMP_CARD_ASPECT}`,
                            ...(stampTemplate.rewardImageUrl
                              ? {
                                  backgroundImage: `url(${stampTemplate.rewardImageUrl})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                }
                              : { backgroundColor: '#7F0404' }),
                          }}
                        >
                          {stampTemplate.rewardImageUrl && (
                            <div className="absolute inset-0 bg-black/50" />
                          )}
                          <div className="relative z-10 h-full flex flex-col items-center justify-center gap-1.5 p-5">
                            <span className="text-[9px] font-semibold text-white/40 uppercase tracking-wider absolute top-3 right-4">
                              Front Side
                            </span>
                            {profile.logoUrl ? (
                              <img
                                src={profile.logoUrl}
                                alt=""
                                className="w-12 h-12 rounded-full object-cover border-2 border-white/30 shadow-md"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                <span className="text-xl font-bold text-white">
                                  {profile.businessName?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                              </div>
                            )}
                            <span className="text-[9px] font-semibold text-white/60 tracking-[3px] uppercase">
                              Loyalty Card
                            </span>
                            <span className="text-base font-extrabold text-white text-center leading-tight drop-shadow-md">
                              {profile.businessName || 'Business Name'}
                            </span>
                            {stampTemplate.rewardTitle && (
                              <span className="text-xs font-medium text-white/80 drop-shadow-sm">
                                {stampTemplate.rewardTitle}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Save Stamp Template Button */}
                <div className="pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {stampSaveStatus === 'success' && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            Stamp card saved!
                          </span>
                        </div>
                      )}
                      {stampSaveStatus === 'error' && (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm font-medium truncate">
                            {stampErrorMessage}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={saveStampTemplate}
                      disabled={stampSaveStatus === 'saving'}
                      className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all font-semibold disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none text-sm"
                    >
                      {stampSaveStatus === 'saving' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Stamp Card</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Loyalty Points Settings - shown when points mode is active */}
          {loyaltyMode === 'points' && (
          <>
          <Card className="p-4 sm:p-6 shadow-card border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl">
                <Coins className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">Loyalty Points</h2>
                <p className="text-sm text-muted-foreground">
                  Configure earning rates
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Points Name &amp; Icon
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Customize what your customers see instead of &quot;Points&quot; and the default star icon
                </p>
                <div className="flex items-start gap-4">
                  <input
                    type="text"
                    maxLength={20}
                    disabled={!isEditing}
                    value={loyalty.coinName}
                    onChange={(e) =>
                      setLoyalty((prev) => ({ ...prev, coinName: e.target.value }))
                    }
                    className={`w-48 px-4 py-2.5 border rounded-xl transition font-semibold ${editableStyle} disabled:opacity-100 disabled:cursor-default`}
                    placeholder="Points"
                  />
                  <div className="flex flex-col items-center gap-1.5">
                    <label
                      className={`relative w-12 h-12 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition ${
                        isEditing
                          ? 'border-gray-300 hover:border-primary cursor-pointer'
                          : 'border-gray-200 cursor-default'
                      }`}
                    >
                      {loyalty.coinImageUrl ? (
                        <img
                          src={loyalty.coinImageUrl}
                          alt="Coin"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Coins className="w-5 h-5 text-muted-foreground/60" />
                      )}
                      {isEditing && (
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={handleCoinImageUpload}
                        />
                      )}
                    </label>
                    <span className="text-[10px] text-muted-foreground">Icon</span>
                  </div>
                </div>
              </div>

              {/* Points Rate Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Points Earning Rate
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {POINTS_RATE_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      disabled={!isEditing}
                      onClick={() => handlePresetChange(preset.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all disabled:cursor-default ${
                        selectedPreset === preset.value
                          ? 'border-primary bg-primary/5 shadow-md'
                          : isEditing
                            ? 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                            : 'border-gray-200'
                      }`}
                    >
                      <p className="font-semibold text-sm text-foreground">{preset.label}</p>
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
                        disabled={!isEditing}
                        value={inputValues.customRate}
                        onChange={(e) => handleCustomRateChange(e.target.value)}
                        onBlur={handleCustomRateBlur}
                        onFocus={(e) => e.target.select()}
                        className={`w-20 px-3 py-2 border rounded-lg text-center font-semibold ${editableStyle} disabled:opacity-100 disabled:cursor-default`}
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
                  <span className="font-medium text-sm text-foreground">Preview</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">₱</span>
                  <input
                    type="number"
                    value={inputValues.previewAmount}
                    onChange={(e) => handlePreviewAmountChange(e.target.value)}
                    onBlur={handlePreviewAmountBlur}
                    onFocus={(e) => e.target.select()}
                    className="w-20 px-2 py-1 border border-gray-200 rounded-lg bg-background text-center font-semibold"
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
              <div className="pt-4 border-t border-border/40">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Advanced
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Min. Purchase
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        ₱
                      </span>
                      <input
                        type="number"
                        min="0"
                        disabled={!isEditing}
                        value={inputValues.minPurchase}
                        onChange={(e) =>
                          handleMinPurchaseChange(e.target.value)
                        }
                        onBlur={handleMinPurchaseBlur}
                        onFocus={(e) => e.target.select()}
                        className={`w-full pl-7 pr-3 py-2 border rounded-lg text-sm ${editableStyle} disabled:opacity-100 disabled:cursor-default`}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Max Points/Txn
                    </label>
                    <input
                      type="number"
                      min="0"
                      disabled={!isEditing}
                      value={loyalty.maxPointsPerTransaction}
                      onChange={(e) =>
                        setLoyalty((prev) => ({
                          ...prev,
                          maxPointsPerTransaction: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 border rounded-lg text-sm ${editableStyle} disabled:opacity-100 disabled:cursor-default`}
                      placeholder="No limit"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Referral Settings - only shown in points mode since referrals award points */}
          <Card className="p-4 sm:p-6 shadow-card border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">Referral Program</h2>
                <p className="text-sm text-muted-foreground">
                  Reward customers who invite friends
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Referral Reward Points
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Points awarded to both the referrer and the new customer when a referral is completed.
                </p>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  disabled={!isEditing}
                  value={referralInput}
                  onChange={(e) => {
                    setReferralInput(e.target.value);
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 1) {
                      setReferralRewardPoints(val);
                    }
                  }}
                  onBlur={() => {
                    const val = parseInt(referralInput);
                    if (isNaN(val) || val < 1) {
                      setReferralInput('1');
                      setReferralRewardPoints(1);
                    } else {
                      setReferralInput(String(val));
                    }
                  }}
                  className={`w-32 px-4 py-2.5 border rounded-xl transition text-center font-semibold ${editableStyle} disabled:opacity-100 disabled:cursor-default`}
                />
                <span className="ml-2 text-sm text-muted-foreground">points each</span>
              </div>

              <div className="p-3 bg-orange-50 rounded-xl border border-orange-200/50">
                <p className="text-xs text-orange-700">
                  When a customer refers a friend using their unique code, both the referrer and the new customer will receive <strong>{referralRewardPoints} points</strong>.
                </p>
              </div>
            </div>
          </Card>
          </>
          )}

          {/* Billing Card (Inline Dropdown) */}
          <Card id="billing" className="p-4 sm:p-6 shadow-card border border-border/50 scroll-mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">Billing</h2>
                <p className="text-sm text-muted-foreground">
                  Manage your plan and invoices
                </p>
              </div>
            </div>

            <button
              onClick={() => setBillingExpanded(!billingExpanded)}
              className="w-full p-4 bg-muted/50 hover:bg-muted/80 rounded-xl flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground text-sm">Plan & Invoices</p>
                  <p className="text-sm text-muted-foreground">
                    View your subscription and billing history
                  </p>
                </div>
              </div>
              {billingExpanded ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground transition-transform" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform" />
              )}
            </button>

            <AnimatePresence>
              {billingExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <BillingSection />
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Security Card */}
          <Card className="p-4 sm:p-6 shadow-card border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-gradient-to-br from-red-100 to-red-50 rounded-xl">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">Security</h2>
                <p className="text-sm text-muted-foreground">
                  Manage account security
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push('/dashboard/settings/security')}
              className="w-full p-4 bg-muted/50 hover:bg-muted/80 rounded-xl flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground text-sm">Change Password</p>
                  <p className="text-sm text-muted-foreground">
                    Update your account password
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </button>
          </Card>
        </div>

        {/* Save Button - bottom of form, visible only in edit mode */}
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            variants={itemVariants}
          >
            <Card className="p-4 shadow-card border-2 border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Status Messages */}
                <div className="flex-1 min-w-0">
                  {saveStatus === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 text-green-600"
                    >
                      <div className="p-1 bg-green-100 rounded-full">
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
                      className="flex items-center gap-2 text-red-600"
                    >
                      <div className="p-1 bg-red-100 rounded-full">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium truncate">
                        {errorMessage}
                      </span>
                    </motion.div>
                  )}
                  {saveStatus === 'idle' && (
                    <p className="text-sm text-muted-foreground">
                      Review your changes and click save to update
                    </p>
                  )}
                </div>

                {/* Save Button */}
                <button
                  onClick={saveSettings}
                  disabled={saveStatus === 'saving'}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 bg-linear-to-r from-primary to-primary/80 text-primary-foreground rounded-xl hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all font-semibold disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
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
        )}
      </motion.div>

      {/* Loyalty Mode Switch Confirmation */}
      <AlertDialog open={pendingMode !== null} onOpenChange={(open) => { if (!open) setPendingMode(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch to {pendingMode === 'stamps' ? 'Stamp Card' : 'Points System'}?</AlertDialogTitle>
            <AlertDialogDescription>
              {loyaltyMode === 'stamps'
                ? `${loyaltyActivityCount} customer${loyaltyActivityCount === 1 ? ' has' : 's have'} active stamp cards. Switching to Points System will freeze their existing stamp cards — no new stamps will be collected.`
                : `${loyaltyActivityCount} customer${loyaltyActivityCount === 1 ? ' has' : 's have'} earned points. Switching to Stamp Card will freeze their existing points — no new points will be earned.`
              }
              {' '}You can switch back anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingMode) saveLoyaltyMode(pendingMode);
                setPendingMode(null);
              }}
            >
              Switch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
