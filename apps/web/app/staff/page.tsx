// apps/web/app/staff/page.tsx

'use client';

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
  pointsPerPurchase: number;
}

interface CustomerData {
  id: string;
  name: string;
  email: string;
  currentPoints: number;
}

interface ScanResult {
  success: boolean;
  customerName?: string;
  pointsAwarded?: number;
  newTotal?: number;
  error?: string;
}

type ScannerState =
  | 'idle'
  | 'scanning'
  | 'customer-found'
  | 'awarding'
  | 'success'
  | 'error';

// ============================================
// MAIN COMPONENT
// ============================================

export default function StaffScannerPage() {
  const router = useRouter();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [staffData, setStaffData] = useState<StaffData | null>(null);
  const [stats, setStats] = useState({ scansToday: 0, pointsAwardedToday: 0 });
  const [scannerState, setScannerState] = useState<ScannerState>('idle');
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [transactionAmount, setTransactionAmount] = useState('');
  const [calculatedPoints, setCalculatedPoints] = useState(0);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>(
    'environment'
  );
  const [error, setError] = useState('');

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
          .select('id, name, points_per_purchase')
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
            pointsPerPurchase: business.points_per_purchase || 1,
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
        .select('name, points_per_purchase')
        .eq('id', staffRecord.business_id)
        .single();

      setStaffData({
        staffId: staffRecord.id,
        businessId: staffRecord.business_id,
        businessName: business?.name || 'Business',
        userName: staffRecord.name || user.user_metadata?.full_name || 'Staff',
        pointsPerPurchase: business?.points_per_purchase || 1,
      });

      // Load today's stats
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
          0
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
      // Small delay to ensure DOM is ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1,
      };

      await html5QrCode.start(
        { facingMode: cameraFacing },
        config,
        onScanSuccess,
        onScanFailure
      );
    } catch (err: any) {
      console.error('Scanner start error:', err);
      setError(
        err.message || 'Failed to start camera. Please allow camera access.'
      );
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
    // Restart with new camera after state update
    setTimeout(() => {
      startScannerWithFacing(newFacing);
    }, 300);
  };

  const startScannerWithFacing = async (facing: 'environment' | 'user') => {
    try {
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1,
      };

      await html5QrCode.start(
        { facingMode: facing },
        config,
        onScanSuccess,
        onScanFailure
      );
    } catch (err: any) {
      console.error('Scanner restart error:', err);
    }
  };

  const onScanSuccess = useCallback(async (decodedText: string) => {
    console.log('QR Scanned:', decodedText);

    // Stop scanner immediately
    await stopScanner();

    // Parse QR code - format: loyaltyhub://customer/{id} or just customer ID
    let customerId = decodedText;

    if (decodedText.startsWith('loyaltyhub://customer/')) {
      customerId = decodedText.replace('loyaltyhub://customer/', '');
    }

    // Look up customer
    await lookupCustomer(customerId);
  }, []);

  const onScanFailure = (error: string) => {
    // Ignore scan failures (no QR in frame)
  };

  // ============================================
  // CUSTOMER LOOKUP
  // ============================================

  const lookupCustomer = async (scannedCode: string) => {
    const supabase = createClient();

    console.log('Looking up customer with code:', scannedCode);

    try {
      let customerData = null;

      // Method 1: Try exact match on qr_code_url (full URL)
      const fullUrl = scannedCode.startsWith('loyaltyhub://')
        ? scannedCode
        : `loyaltyhub://customer/${scannedCode}`;

      console.log('Trying exact match:', fullUrl);

      const { data: exactMatch } = await supabase
        .from('customers')
        .select('id, user_id, total_points, qr_code_url')
        .eq('qr_code_url', fullUrl)
        .maybeSingle();

      if (exactMatch) {
        console.log('Found by exact match:', exactMatch.id);
        customerData = exactMatch;
      }

      // Method 2: Try partial match (case-insensitive) if exact match fails
      if (!customerData) {
        console.log('Trying partial match with:', scannedCode);

        const { data: partialMatch } = await supabase
          .from('customers')
          .select('id, user_id, total_points, qr_code_url')
          .ilike('qr_code_url', `%${scannedCode}%`)
          .maybeSingle();

        if (partialMatch) {
          console.log('Found by partial match:', partialMatch.id);
          customerData = partialMatch;
        }
      }

      // Method 3: Try by customer ID directly (if UUID was scanned)
      if (!customerData && scannedCode.length === 36) {
        console.log('Trying UUID match:', scannedCode);

        const { data: idMatch } = await supabase
          .from('customers')
          .select('id, user_id, total_points, qr_code_url')
          .eq('id', scannedCode)
          .maybeSingle();

        if (idMatch) {
          console.log('Found by ID match:', idMatch.id);
          customerData = idMatch;
        }
      }

      if (!customerData) {
        console.log('Customer not found for code:', scannedCode);
        setError('Customer not found. Please try again.');
        setScannerState('error');
        return;
      }

      // Get customer name from auth.users metadata via API
      let customerName = `Customer #${customerData.id.slice(-6).toUpperCase()}`;

      // Try to get the actual name from user metadata
      try {
        const response = await fetch(
          `/api/customer/${customerData.user_id}/profile`
        );
        if (response.ok) {
          const profile = await response.json();
          if (profile.name) {
            customerName = profile.name;
          }
        }
      } catch {
        // Use default name if API fails
        console.log('Could not fetch customer profile, using default name');
      }

      console.log('Customer found:', {
        id: customerData.id,
        name: customerName,
        points: customerData.total_points,
      });

      setCustomer({
        id: customerData.id,
        name: customerName,
        email: '',
        currentPoints: customerData.total_points || 0,
      });

      setScannerState('customer-found');
    } catch (err) {
      console.error('Customer lookup error:', err);
      setError('Failed to find customer. Please try again.');
      setScannerState('error');
    }
  };

  // ============================================
  // POINTS CALCULATION
  // ============================================

  useEffect(() => {
    if (transactionAmount && staffData) {
      const amount = parseFloat(transactionAmount) || 0;
      const points = Math.floor(amount * staffData.pointsPerPurchase);
      setCalculatedPoints(points);
    } else {
      setCalculatedPoints(0);
    }
  }, [transactionAmount, staffData]);

  // ============================================
  // AWARD POINTS
  // ============================================

  const awardPoints = async () => {
    if (!customer || !staffData || calculatedPoints <= 0) return;

    setScannerState('awarding');

    const supabase = createClient();

    try {
      const amount = parseFloat(transactionAmount) || 0;

      // Record the scan
      const { error: scanError } = await supabase.from('scan_logs').insert({
        staff_id: staffData.staffId,
        business_id: staffData.businessId,
        customer_id: customer.id,
        points_awarded: calculatedPoints,
        transaction_amount: amount,
      });

      if (scanError) throw scanError;

      // Update customer points
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          total_points: customer.currentPoints + calculatedPoints,
          last_visit: new Date().toISOString(),
        })
        .eq('id', customer.id);

      if (updateError) throw updateError;

      // Record transaction
      await supabase.from('transactions').insert({
        customer_id: customer.id,
        business_id: staffData.businessId,
        type: 'earn',
        points: calculatedPoints,
        amount_spent: amount,
      });

      // Update local stats
      setStats((prev) => ({
        scansToday: prev.scansToday + 1,
        pointsAwardedToday: prev.pointsAwardedToday + calculatedPoints,
      }));

      setScanResult({
        success: true,
        customerName: customer.name,
        pointsAwarded: calculatedPoints,
        newTotal: customer.currentPoints + calculatedPoints,
      });

      setScannerState('success');
    } catch (err: any) {
      console.error('Award points error:', err);
      setScanResult({
        success: false,
        error: err.message || 'Failed to award points',
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
    setCalculatedPoints(0);
    setScanResult(null);
    setError('');
    setScannerState('idle');
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
        {/* IDLE STATE - Ready to Scan */}
        {scannerState === 'idle' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <button
              onClick={startScanner}
              className="w-40 h-40 bg-linear-to-br from-cyan-600 to-blue-600 rounded-full flex flex-col items-center justify-center mb-6 hover:shadow-2xl hover:shadow-cyan-500/30 hover:scale-105 transition-all active:scale-95"
            >
              <QrCode className="w-14 h-14 mb-2" />
              <span className="font-semibold text-sm">Scan Customer</span>
            </button>
            <p className="text-gray-500 text-sm">
              Tap to scan customer QR code
            </p>
          </div>
        )}

        {/* SCANNING STATE - Camera Active */}
        {scannerState === 'scanning' && (
          <div className="flex flex-col items-center">
            {/* Camera Container */}
            <div className="relative w-full max-w-sm aspect-square bg-black rounded-2xl overflow-hidden mb-4">
              <div id={scannerContainerId} className="w-full h-full" />

              {/* Overlay Frame */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-cyan-400 rounded-xl relative">
                    {/* Corner accents */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />
                  </div>
                </div>
              </div>

              {/* Switch Camera Button */}
              <button
                onClick={switchCamera}
                className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors z-10"
                aria-label="Switch camera"
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

        {/* CUSTOMER FOUND STATE - Enter Amount */}
        {scannerState === 'customer-found' && customer && (
          <div className="max-w-sm mx-auto">
            {/* Customer Info */}
            <div className="bg-gray-800 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-cyan-500/20 rounded-full flex items-center justify-center">
                  <User className="w-7 h-7 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{customer.name}</h2>
                  <p className="text-gray-400 text-sm">
                    Current Points: {customer.currentPoints.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 p-3 bg-green-500/10 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-green-400 font-medium">
                  Customer Verified
                </span>
              </div>
            </div>

            {/* Transaction Amount Input */}
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-cyan-400" />
                  <span className="text-gray-300">Points to Award</span>
                </div>
                <span className="text-2xl font-bold text-cyan-400">
                  +{calculatedPoints.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Rate: {staffData?.pointsPerPurchase} point(s) per ₱1
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
                disabled={calculatedPoints <= 0}
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
                +{scanResult.pointsAwarded?.toLocaleString()}
              </p>
              <p className="text-gray-400">points added</p>
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
      </main>

      {/* Today's Stats Footer */}
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
