// apps/web/app/staff/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  QrCode,
  LogOut,
  CheckCircle,
  AlertCircle,
  Loader2,
  User,
  Award,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import {
  getCurrentStaffRole,
  getStaffTodayStats,
  recordScan,
} from '@/lib/staff';
import { logout } from '@/lib/auth';

export default function StaffScannerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [staffData, setStaffData] = useState<{
    staffId: string;
    businessName: string;
    userName: string;
  } | null>(null);
  const [stats, setStats] = useState({ scansToday: 0, pointsAwardedToday: 0 });
  const [scanMode, setScanMode] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    customerName?: string;
    pointsAwarded?: number;
    error?: string;
  } | null>(null);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const roleData = await getCurrentStaffRole();

    // If owner or no role, redirect
    if (roleData.role === 'owner') {
      router.push('/dashboard');
      return;
    }

    if (!roleData.role || !roleData.staffId) {
      router.push('/login');
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setStaffData({
      staffId: roleData.staffId,
      businessName: roleData.businessName || 'Business',
      userName:
        user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Staff',
    });

    // Load today's stats
    const todayStats = await getStaffTodayStats(roleData.staffId);
    setStats(todayStats);

    setIsLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const simulateScan = async () => {
    // In production, this would use a real QR scanner
    // For now, simulate a successful scan
    setScanMode(true);

    setTimeout(async () => {
      // Simulate scan result
      const mockCustomerId = 'mock-customer-id';
      const pointsToAward = 25;

      if (staffData?.staffId) {
        const result = await recordScan(
          staffData.staffId,
          mockCustomerId,
          pointsToAward,
          250 // ₱250 transaction
        );

        if (result.success) {
          setScanResult({
            success: true,
            customerName: 'Maria Santos',
            pointsAwarded: pointsToAward,
          });
          setStats((prev) => ({
            scansToday: prev.scansToday + 1,
            pointsAwardedToday: prev.pointsAwardedToday + pointsToAward,
          }));
        } else {
          setScanResult({
            success: false,
            error: result.error || 'Scan failed',
          });
        }
      }

      setScanMode(false);
    }, 2000);
  };

  const resetScan = () => {
    setScanResult(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-900 to-gray-950 text-white">
      {/* Header */}
      <header className="p-6 flex items-center justify-between border-b border-gray-800">
        <div>
          <h1 className="text-xl font-bold text-cyan-400">
            {staffData?.businessName}
          </h1>
          <p className="text-sm text-gray-400">
            Cashier: {staffData?.userName}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5 text-gray-400" />
        </button>
      </header>

      {/* Main Content */}
      <main className="p-6 flex flex-col items-center justify-center min-h-[calc(100vh-180px)]">
        {scanResult ? (
          // Scan Result
          <div className="text-center w-full max-w-sm">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
                scanResult.success ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}
            >
              {scanResult.success ? (
                <CheckCircle className="w-12 h-12 text-green-500" />
              ) : (
                <AlertCircle className="w-12 h-12 text-red-500" />
              )}
            </div>

            {scanResult.success ? (
              <>
                <h2 className="text-2xl font-bold mb-2">Points Awarded!</h2>
                <p className="text-gray-400 mb-4">
                  <span className="text-white font-semibold">
                    {scanResult.customerName}
                  </span>
                </p>
                <div className="bg-gray-800 rounded-2xl p-6 mb-6">
                  <p className="text-4xl font-bold text-cyan-400">
                    +{scanResult.pointsAwarded}
                  </p>
                  <p className="text-gray-400">points</p>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-2 text-red-400">
                  Scan Failed
                </h2>
                <p className="text-gray-400 mb-6">{scanResult.error}</p>
              </>
            )}

            <button
              onClick={resetScan}
              className="w-full py-4 bg-linear-to-r from-cyan-600 to-blue-600 rounded-2xl font-semibold hover:shadow-lg transition-all"
            >
              Scan Another Customer
            </button>
          </div>
        ) : scanMode ? (
          // Scanning Mode
          <div className="text-center">
            <div className="w-64 h-64 border-4 border-cyan-500 rounded-3xl flex items-center justify-center mb-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-b from-cyan-500/20 to-transparent animate-pulse" />
              <QrCode className="w-24 h-24 text-cyan-500" />
            </div>
            <p className="text-gray-400">Scanning...</p>
          </div>
        ) : (
          // Ready to Scan
          <div className="text-center w-full max-w-sm">
            <button
              onClick={simulateScan}
              className="w-48 h-48 bg-linear-to-br from-cyan-600 to-blue-600 rounded-full flex flex-col items-center justify-center mx-auto mb-8 hover:shadow-2xl hover:shadow-cyan-500/30 hover:scale-105 transition-all active:scale-95"
            >
              <QrCode className="w-16 h-16 mb-2" />
              <span className="font-semibold">Scan Customer</span>
            </button>
            <p className="text-gray-500">Tap to scan customer QR code</p>
          </div>
        )}
      </main>

      {/* Today's Stats */}
      <footer className="fixed bottom-0 left-0 right-0 bg-gray-800/50 backdrop-blur-lg border-t border-gray-700 p-4">
        <div className="max-w-sm mx-auto">
          <p className="text-sm text-gray-400 text-center mb-3">
            Today's Activity
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <User className="w-4 h-4 text-cyan-400" />
                <span className="text-2xl font-bold">{stats.scansToday}</span>
              </div>
              <p className="text-xs text-gray-400">Customers Scanned</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Award className="w-4 h-4 text-cyan-400" />
                <span className="text-2xl font-bold">
                  {stats.pointsAwardedToday}
                </span>
              </div>
              <p className="text-xs text-gray-400">Points Awarded</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
