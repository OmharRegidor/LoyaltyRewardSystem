// apps/web/app/staff/page.tsx

'use client';

import { UserPlus } from 'lucide-react';
import { AddCustomerModal } from '@/components/staff/add-customer-modal';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  QrCode,
  LogOut,
  CheckCircle,
  AlertCircle,
  Loader2,
  User,
  Award,
  SwitchCamera,
  Coins,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { Html5Qrcode } from 'html5-qrcode';

// ============================================
// TYPES
// ============================================

interface StaffData {
  staffId: string;
  businessId: string;
  businessName: string;
  userName: string;
  pesosPerPoint: number;
}

interface CustomerData {
  id: string;
  name: string;
  email: string;
  currentPoints: number;
  lifetimePoints: number;
  tier: TierKey;
}

interface ScanResult {
  success: boolean;
  customerName?: string;
  basePoints?: number;
  bonusPoints?: number;
  totalPointsAwarded?: number;
  multiplier?: number;
  newTotal?: number;
  error?: string;
}

type ScannerState =
  | 'idle'
  | 'scanning'
  | 'customer-found'
  | 'awarding'
  | 'success'
  | 'error'
  | 'verify-redemption';

interface RedemptionData {
  id: string;
  code: string;
  rewardTitle: string;
  pointsUsed: number;
  customerName: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

// ============================================
// TIER CONFIGURATION
// ============================================

type TierKey = 'bronze' | 'silver' | 'gold' | 'platinum';

const TIERS: Record<
  TierKey,
  { name: string; multiplier: number; color: string; emoji: string }
> = {
  bronze: { name: 'Bronze', multiplier: 1.0, color: '#CD7F32', emoji: '🥉' },
  silver: { name: 'Silver', multiplier: 1.25, color: '#C0C0C0', emoji: '🥈' },
  gold: { name: 'Gold', multiplier: 1.5, color: '#FFD700', emoji: '🥇' },
  platinum: {
    name: 'Platinum',
    multiplier: 2.0,
    color: '#E5E4E2',
    emoji: '💎',
  },
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function StaffScannerPage() {
  const router = useRouter();

  // State
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [staffData, setStaffData] = useState<StaffData | null>(null);
  const [stats, setStats] = useState({ scansToday: 0, pointsAwardedToday: 0 });
  const [scannerState, setScannerState] = useState<ScannerState>('idle');
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [transactionAmount, setTransactionAmount] = useState('');
  const [calculatedPoints, setCalculatedPoints] = useState({
    base: 0,
    bonus: 0,
    total: 0,
  });
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>(
    'environment',
  );
  const [error, setError] = useState('');
  const [redemptionCode, setRedemptionCode] = useState('');
  const [redemptionData, setRedemptionData] = useState<RedemptionData | null>(
    null,
  );
  const [isVerifying, setIsVerifying] = useState(false);

  // Refs
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-scanner-container';

  // ============================================
  // INITIALIZATION
  // ============================================

  useEffect(() => {
    checkAccess();
    return () => {
      stopScanner();
    };
  }, []);

  const checkAccess = async () => {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/staff/login');
        return;
      }

      // Check if user is staff
      const { data: staffRecord } = await supabase
        .from('staff')
        .select('id, business_id, role, name, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!staffRecord) {
        // Check if owner
        const { data: business } = await supabase
          .from('businesses')
          .select('id, name, pesos_per_point')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (business) {
          setStaffData({
            staffId: user.id,
            businessId: business.id,
            businessName: business.name,
            userName:
              user.user_metadata?.full_name ||
              user.email?.split('@')[0] ||
              'Owner',
            pesosPerPoint: business.pesos_per_point || 10,
          });
          setIsLoading(false);
          return;
        }

        router.push('/staff/login');
        return;
      }

      // Get business info
      const { data: business } = await supabase
        .from('businesses')
        .select('name, pesos_per_point')
        .eq('id', staffRecord.business_id)
        .single();

      setStaffData({
        staffId: staffRecord.id,
        businessId: staffRecord.business_id,
        businessName: business?.name || 'Business',
        userName: staffRecord.name || user.user_metadata?.full_name || 'Staff',
        pesosPerPoint: business?.pesos_per_point || 10,
      });

      await loadTodayStats(staffRecord.id);
      setIsLoading(false);
    } catch (err) {
      console.error('Access check error:', err);
      router.push('/staff/login');
    }
  };

  const loadTodayStats = async (staffId: string) => {
    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from('scan_logs')
      .select('points_awarded')
      .eq('staff_id', staffId)
      .gte('scanned_at', today);

    if (data) {
      setStats({
        scansToday: data.length,
        pointsAwardedToday: data.reduce(
          (sum, log) => sum + (log.points_awarded || 0),
          0,
        ),
      });
    }
  };

  // ============================================
  // QR SCANNER FUNCTIONS
  // ============================================

  const startScanner = async () => {
    setScannerState('scanning');
    setError('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: cameraFacing },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        onScanSuccess,
        () => {},
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to start camera';
      setError(message);
      setScannerState('error');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error('Scanner stop error:', err);
      }
    }
  };

  const switchCamera = async () => {
    await stopScanner();
    const newFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(newFacing);
    setTimeout(() => startScannerWithFacing(newFacing), 300);
  };

  const startScannerWithFacing = async (facing: 'environment' | 'user') => {
    try {
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: facing },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        onScanSuccess,
        () => {},
      );
    } catch (err) {
      console.error('Scanner restart error:', err);
    }
  };

  const onScanSuccess = useCallback(async (decodedText: string) => {
    await stopScanner();
    await lookupCustomer(decodedText);
  }, []);

  // ============================================
  // CUSTOMER LOOKUP
  // ============================================

  const lookupCustomer = async (scannedCode: string) => {
    const supabase = createClient();

    try {
      let customerData = null;

      // Method 1: Try exact match on qr_code_url
      const fullUrl = scannedCode.startsWith('NoxaLoyalty://')
        ? scannedCode
        : `NoxaLoyalty://customer/${scannedCode}`;

      const { data: exactMatch } = await supabase
        .from('customers')
        .select(
          'id, user_id, total_points, lifetime_points, tier, qr_code_url, full_name, email',
        )
        .eq('qr_code_url', fullUrl)
        .maybeSingle();

      if (exactMatch) {
        customerData = exactMatch;
      }

      // Method 2: Partial match
      if (!customerData) {
        const shortCode = scannedCode.startsWith('NoxaLoyalty://customer/')
          ? scannedCode.replace('NoxaLoyalty://customer/', '')
          : scannedCode;

        const { data: partialMatch } = await supabase
          .from('customers')
          .select(
            'id, user_id, total_points, lifetime_points, tier, qr_code_url, full_name, email',
          )
          .ilike('qr_code_url', `%${shortCode}%`)
          .maybeSingle();

        if (partialMatch) customerData = partialMatch;
      }

      // Method 3: UUID match
      if (!customerData && scannedCode.length === 36) {
        const { data: idMatch } = await supabase
          .from('customers')
          .select(
            'id, user_id, total_points, lifetime_points, tier, qr_code_url, full_name, email',
          )
          .eq('id', scannedCode)
          .maybeSingle();

        if (idMatch) customerData = idMatch;
      }

      if (!customerData) {
        setError('Customer not found. Please try again.');
        setScannerState('error');
        return;
      }

      // Get customer name - prefer full_name from staff-created, then try user metadata
      let customerName = customerData.full_name || '';

      if (!customerName && customerData.user_id) {
        try {
          const response = await fetch(
            `/api/customer/${customerData.user_id}/profile`,
          );
          if (response.ok) {
            const profile = await response.json();
            if (profile.name) customerName = profile.name;
          }
        } catch {
          // Use fallback
        }
      }

      if (!customerName) {
        customerName = `Customer #${customerData.id.slice(-6).toUpperCase()}`;
      }

      const tier = (customerData.tier as TierKey) || 'bronze';

      setCustomer({
        id: customerData.id,
        name: customerName,
        email: customerData.email || '',
        currentPoints: customerData.total_points || 0,
        lifetimePoints: customerData.lifetime_points || 0,
        tier,
      });

      setScannerState('customer-found');
    } catch (err) {
      console.error('Customer lookup error:', err);
      setError('Failed to find customer. Please try again.');
      setScannerState('error');
    }
  };

  // ============================================
  // POINTS CALCULATION WITH TIER MULTIPLIER
  // ============================================

  useEffect(() => {
    if (transactionAmount && staffData && customer) {
      const amount = parseFloat(transactionAmount) || 0;
      const basePoints = Math.floor(amount / staffData.pesosPerPoint);
      const multiplier = TIERS[customer.tier].multiplier;
      const totalPoints = Math.floor(basePoints * multiplier);
      const bonusPoints = totalPoints - basePoints;

      setCalculatedPoints({
        base: basePoints,
        bonus: bonusPoints,
        total: totalPoints,
      });
    } else {
      setCalculatedPoints({ base: 0, bonus: 0, total: 0 });
    }
  }, [transactionAmount, staffData, customer]);

  // ============================================
  // AWARD POINTS
  // ============================================

  const awardPoints = async () => {
    if (!customer || !staffData || calculatedPoints.total <= 0) return;

    setScannerState('awarding');
    const supabase = createClient();

    try {
      const amount = parseFloat(transactionAmount) || 0;
      const multiplier = TIERS[customer.tier].multiplier;

      // Record scan log
      await supabase.from('scan_logs').insert({
        staff_id: staffData.staffId,
        business_id: staffData.businessId,
        customer_id: customer.id,
        points_awarded: calculatedPoints.total,
        transaction_amount: amount,
      });

      // Calculate new values
      const newTotalPoints = customer.currentPoints + calculatedPoints.total;
      const newLifetimePoints =
        customer.lifetimePoints + calculatedPoints.total;

      // Update customer
      await supabase
        .from('customers')
        .update({
          total_points: newTotalPoints,
          lifetime_points: newLifetimePoints,
          last_visit: new Date().toISOString(),
        })
        .eq('id', customer.id);

      // Record transaction with tier bonus info
      const description =
        multiplier > 1
          ? `Purchase at ${staffData.businessName} (${
              TIERS[customer.tier].name
            } ${multiplier}x bonus)`
          : `Purchase at ${staffData.businessName}`;

      await supabase.from('transactions').insert({
        customer_id: customer.id,
        business_id: staffData.businessId,
        type: 'earn',
        points: calculatedPoints.total,
        amount_spent: amount,
        description,
      });

      // Update stats
      setStats((prev) => ({
        scansToday: prev.scansToday + 1,
        pointsAwardedToday: prev.pointsAwardedToday + calculatedPoints.total,
      }));

      setScanResult({
        success: true,
        customerName: customer.name,
        basePoints: calculatedPoints.base,
        bonusPoints: calculatedPoints.bonus,
        totalPointsAwarded: calculatedPoints.total,
        multiplier,
        newTotal: newTotalPoints,
      });

      setScannerState('success');
    } catch (err) {
      console.error('Award points error:', err);
      setScanResult({
        success: false,
        error: err instanceof Error ? err.message : 'Failed to award points',
      });
      setScannerState('error');
    }
  };

  // ============================================
  // RESET & LOGOUT
  // ============================================

  const resetScanner = () => {
    setCustomer(null);
    setTransactionAmount('');
    setCalculatedPoints({ base: 0, bonus: 0, total: 0 });
    setScanResult(null);
    setError('');
    setScannerState('idle');
    setRedemptionCode('');
    setRedemptionData(null);
  };

  // ============================================
  // VERIFY REDEMPTION
  // ============================================

  const verifyRedemptionCode = async () => {
    if (!redemptionCode.trim() || !staffData) return;

    setIsVerifying(true);
    setError('');
    const supabase = createClient();

    try {
      // Find redemption by code
      const { data: redemption, error: fetchError } = await supabase
        .from('redemptions')
        .select(
          `
        id,
        redemption_code,
        points_used,
        status,
        expires_at,
        created_at,
        customer_id,
        reward_id,
        customers (full_name, email),
        rewards (title)
      `,
        )
        .eq('redemption_code', redemptionCode.toUpperCase().trim())
        .eq('business_id', staffData.businessId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!redemption) {
        setError('Redemption code not found');
        setIsVerifying(false);
        return;
      }

      // Check if already completed
      if (redemption.status === 'completed') {
        setError('This code has already been used');
        setIsVerifying(false);
        return;
      }

      // Check if expired
      if (
        redemption.expires_at &&
        new Date(redemption.expires_at) < new Date()
      ) {
        setError('This code has expired');
        setIsVerifying(false);
        return;
      }

      // Check if cancelled
      if (redemption.status === 'cancelled') {
        setError('This redemption was cancelled');
        setIsVerifying(false);
        return;
      }

      const customer = redemption.customers as {
        full_name: string | null;
        email: string | null;
      } | null;
      const reward = redemption.rewards as { title: string } | null;

      setRedemptionData({
        id: redemption.id,
        code: redemption.redemption_code,
        rewardTitle: reward?.title || 'Unknown Reward',
        pointsUsed: redemption.points_used,
        customerName: customer?.full_name || customer?.email || 'Customer',
        status: redemption.status || 'pending',
        expiresAt: redemption.expires_at,
        createdAt: redemption.created_at || new Date().toISOString(),
      });
    } catch (err) {
      console.error('Verify error:', err);
      setError('Failed to verify code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const completeRedemption = async () => {
    if (!redemptionData || !staffData) return;

    setIsVerifying(true);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error: updateError } = await supabase
        .from('redemptions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by_user_id: user?.id,
        })
        .eq('id', redemptionData.id);

      if (updateError) throw updateError;

      // Show success
      setScanResult({
        success: true,
        customerName: redemptionData.customerName,
        totalPointsAwarded: redemptionData.pointsUsed,
      });
      setScannerState('success');
      setRedemptionData(null);
      setRedemptionCode('');
    } catch (err) {
      console.error('Complete redemption error:', err);
      setError('Failed to complete redemption');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = async () => {
    await stopScanner();
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.replace('/staff/login');
  };

  // ============================================
  // RENDER: LOADING
  // ============================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
      </div>
    );
  }

  const tierInfo = customer ? TIERS[customer.tier] : null;

  // ============================================
  // RENDER: MAIN
  // ============================================

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-900 to-gray-950 text-white">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-gray-800">
        <div>
          <h1 className="text-lg font-bold text-cyan-400">
            {staffData?.businessName}
          </h1>
          <p className="text-sm text-gray-400">
            Cashier: {staffData?.userName}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Logout"
        >
          <LogOut className="w-5 h-5 text-gray-400" />
        </button>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-32">
        {/* IDLE STATE */}
        {scannerState === 'idle' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <button
              onClick={startScanner}
              className="w-40 h-40 bg-linear-to-br from-cyan-600 to-blue-600 rounded-full flex flex-col items-center justify-center mb-6 hover:shadow-2xl hover:shadow-cyan-500/30 hover:scale-105 transition-all active:scale-95"
            >
              <QrCode className="w-14 h-14 mb-2" />
              <span className="font-semibold text-sm">Scan Customer</span>
            </button>
            <p className="text-gray-500 text-sm mb-8">
              Tap to scan customer QR code
            </p>

            {/* Action Buttons Row */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setIsAddCustomerModalOpen(true)}
                className="flex items-center gap-2 px-5 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-colors"
              >
                <UserPlus className="w-5 h-5 text-cyan-400" />
                <span className="text-gray-300 text-sm">Add Customer</span>
              </button>
              <button
                onClick={() => setScannerState('verify-redemption')}
                className="flex items-center gap-2 px-5 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-colors"
              >
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-gray-300 text-sm">Verify Code</span>
              </button>
            </div>
            <p className="text-gray-600 text-xs">
              Add customers or verify redemption codes
            </p>
          </div>
        )}

        {/* VERIFY REDEMPTION STATE */}
        {scannerState === 'verify-redemption' && (
          <div className="max-w-sm mx-auto">
            <h2 className="text-xl font-bold text-center mb-6">
              Verify Redemption
            </h2>

            {/* Code Input */}
            {!redemptionData && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Enter 6-digit code
                  </label>
                  <input
                    type="text"
                    value={redemptionCode}
                    onChange={(e) =>
                      setRedemptionCode(
                        e.target.value.toUpperCase().slice(0, 6),
                      )
                    }
                    placeholder="ABC123"
                    className="w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white text-2xl font-mono text-center tracking-widest placeholder-gray-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    maxLength={6}
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={resetScanner}
                    className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={verifyRedemptionCode}
                    disabled={redemptionCode.length < 6 || isVerifying}
                    className="flex-1 py-4 bg-linear-to-r from-cyan-600 to-blue-600 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isVerifying ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Verify'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Redemption Found */}
            {redemptionData && (
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-green-400 mb-1">
                    Valid Code
                  </h3>
                  <p className="text-gray-400 text-sm">Ready to complete</p>
                </div>

                <div className="bg-gray-800 rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Code</span>
                    <span className="font-mono font-bold text-cyan-400">
                      {redemptionData.code}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reward</span>
                    <span className="font-medium text-white">
                      {redemptionData.rewardTitle}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Customer</span>
                    <span className="text-white">
                      {redemptionData.customerName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Points Used</span>
                    <span className="text-white">
                      {redemptionData.pointsUsed.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Expires</span>
                    <span className="text-white">
                      {new Date(redemptionData.expiresAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={resetScanner}
                    className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={completeRedemption}
                    disabled={isVerifying}
                    className="flex-1 py-4 bg-linear-to-r from-green-600 to-emerald-600 rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isVerifying ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Complete
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SCANNING STATE */}
        {scannerState === 'scanning' && (
          <div className="flex flex-col items-center">
            <div className="relative w-full max-w-sm aspect-square bg-black rounded-2xl overflow-hidden mb-4">
              <div id={scannerContainerId} className="w-full h-full" />
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-cyan-400 rounded-xl relative">
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />
                  </div>
                </div>
              </div>
              <button
                onClick={switchCamera}
                className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors z-10"
              >
                <SwitchCamera className="w-5 h-5 text-white" />
              </button>
            </div>
            <p className="text-gray-400 mb-4">
              Point camera at customer's QR code
            </p>
            <button
              onClick={() => {
                stopScanner();
                setScannerState('idle');
              }}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* CUSTOMER FOUND STATE */}
        {scannerState === 'customer-found' && customer && tierInfo && (
          <div className="max-w-sm mx-auto">
            {/* Customer Info */}
            <div className="bg-gray-800 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-cyan-500/20 rounded-full flex items-center justify-center">
                  <User className="w-7 h-7 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">{customer.name}</h2>
                  <p className="text-gray-400 text-sm">
                    {customer.currentPoints.toLocaleString()} points
                  </p>
                </div>
                {/* Tier Badge */}
                <div
                  className="px-3 py-1.5 rounded-full flex items-center gap-1.5"
                  style={{ backgroundColor: tierInfo.color + '20' }}
                >
                  <span>{tierInfo.emoji}</span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: tierInfo.color }}
                  >
                    {tierInfo.name}
                  </span>
                </div>
              </div>

              {/* Tier Multiplier Info */}
              {tierInfo.multiplier > 1 && (
                <div className="flex items-center gap-2 p-3 bg-linear-to-r from-amber-500/10 to-yellow-500/10 rounded-xl border border-amber-500/20">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-300 font-medium">
                    {tierInfo.multiplier}x Points Bonus Active!
                  </span>
                </div>
              )}
            </div>

            {/* Transaction Amount */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Transaction Amount (₱)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                  ₱
                </span>
                <input
                  type="number"
                  value={transactionAmount}
                  onChange={(e) => setTransactionAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white text-xl font-semibold placeholder-gray-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* Points Calculation */}
            <div className="bg-linear-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-cyan-400" />
                  <span className="text-gray-300">Points to Award</span>
                </div>
                <span className="text-2xl font-bold text-cyan-400">
                  +{calculatedPoints.total.toLocaleString()}
                </span>
              </div>

              {/* Breakdown */}
              <div className="space-y-1 pt-3 border-t border-cyan-500/20">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Base points</span>
                  <span className="text-gray-300">
                    {calculatedPoints.base.toLocaleString()}
                  </span>
                </div>
                {calculatedPoints.bonus > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {tierInfo.name} bonus ({tierInfo.multiplier}x)
                    </span>
                    <span className="text-amber-400">
                      +{calculatedPoints.bonus.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-3">
                Rate: ₱{staffData?.pesosPerPoint} = 1 base point
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={resetScanner}
                className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={awardPoints}
                disabled={calculatedPoints.total <= 0}
                className="flex-1 py-4 bg-linear-to-r from-cyan-600 to-blue-600 rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Award Points
              </button>
            </div>
          </div>
        )}

        {/* AWARDING STATE */}
        {scannerState === 'awarding' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
            <p className="text-gray-400">Awarding points...</p>
          </div>
        )}

        {/* SUCCESS STATE */}
        {scannerState === 'success' && scanResult?.success && (
          <div className="max-w-sm mx-auto text-center">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Points Awarded!</h2>
            <p className="text-gray-400 mb-6">{scanResult.customerName}</p>

            <div className="bg-gray-800 rounded-2xl p-6 mb-6">
              <p className="text-5xl font-bold text-cyan-400 mb-2">
                +{scanResult.totalPointsAwarded?.toLocaleString()}
              </p>
              <p className="text-gray-400">points added</p>

              {/* Bonus breakdown */}
              {scanResult.bonusPoints && scanResult.bonusPoints > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Base points</span>
                    <span className="text-gray-400">
                      {scanResult.basePoints?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-400">
                      Tier bonus ({scanResult.multiplier}x)
                    </span>
                    <span className="text-amber-400">
                      +{scanResult.bonusPoints.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-500">New Balance</p>
                <p className="text-xl font-semibold text-white">
                  {scanResult.newTotal?.toLocaleString()} points
                </p>
              </div>
            </div>

            <button
              onClick={resetScanner}
              className="w-full py-4 bg-linear-to-r from-cyan-600 to-blue-600 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Scan Next Customer
            </button>
          </div>
        )}

        {/* ERROR STATE */}
        {scannerState === 'error' && (
          <div className="max-w-sm mx-auto text-center">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-red-400">
              {scanResult?.error ? 'Award Failed' : 'Scan Error'}
            </h2>
            <p className="text-gray-400 mb-6">
              {scanResult?.error ||
                error ||
                'Something went wrong. Please try again.'}
            </p>
            <button
              onClick={resetScanner}
              className="w-full py-4 bg-linear-to-r from-cyan-600 to-blue-600 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Add Customer Modal */}
        <AddCustomerModal
          isOpen={isAddCustomerModalOpen}
          onClose={() => setIsAddCustomerModalOpen(false)}
          businessName={staffData?.businessName || 'Business'}
        />
      </main>

      {/* Footer Stats */}
      <footer className="fixed bottom-0 left-0 right-0 bg-gray-800/90 backdrop-blur-lg border-t border-gray-700 p-4">
        <div className="max-w-sm mx-auto">
          <p className="text-xs text-gray-400 text-center mb-2">
            Today's Activity
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900/50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <User className="w-4 h-4 text-cyan-400" />
                <span className="text-xl font-bold">{stats.scansToday}</span>
              </div>
              <p className="text-xs text-gray-500">Customers Scanned</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Award className="w-4 h-4 text-cyan-400" />
                <span className="text-xl font-bold">
                  {stats.pointsAwardedToday.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-500">Points Awarded</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
