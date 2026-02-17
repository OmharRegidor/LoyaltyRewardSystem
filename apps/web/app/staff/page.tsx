// apps/web/app/staff/page.tsx

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  CheckCircle,
  AlertCircle,
  Loader2,
  User,
  Award,
  ShieldOff,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Html5Qrcode } from "html5-qrcode";
import type { TierKey, StaffSaleResult } from "@/types/staff-pos.types";
import { useStaffPOS } from "@/hooks/useStaffPOS";

// Components
import { AddCustomerModal } from "@/components/staff/add-customer-modal";
import { IdleView } from "@/components/staff/idle-view";
import { ScannerView } from "@/components/staff/scanner-view";
import { VerifyRedemptionView } from "@/components/staff/verify-redemption-view";
import { CustomerInfoBar } from "@/components/staff/pos/customer-info-bar";
import { ProductSelector } from "@/components/staff/pos/product-selector";
import { CartSection } from "@/components/staff/pos/cart-section";
import { DiscountSection } from "@/components/staff/pos/discount-section";
import { ExchangeSection } from "@/components/staff/pos/exchange-section";
import { OrderSummary } from "@/components/staff/pos/order-summary";

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
  isFirstVisit: boolean;
}

type ScannerState =
  | "idle"
  | "scanning"
  | "customer-found"
  | "processing"
  | "success"
  | "error"
  | "verify-redemption";

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
  const [scannerState, setScannerState] = useState<ScannerState>("idle");
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [saleResult, setSaleResult] = useState<StaffSaleResult | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">(
    "environment",
  );
  const [error, setError] = useState("");
  const [isDeactivated, setIsDeactivated] = useState(false);

  // Refs
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-scanner-container";

  // POS hook (initialized with defaults, updated when customer is found)
  const pos = useStaffPOS({
    pesosPerPoint: staffData?.pesosPerPoint || 10,
    customerPoints: customer?.currentPoints || 0,
    customerTier: customer?.tier || "bronze",
    customerId: customer?.id || "",
  });

  // ============================================
  // INITIALIZATION
  // ============================================

  useEffect(() => {
    checkAccess();
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time staff deactivation detection
  useEffect(() => {
    if (!staffData) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`staff-status-${staffData.staffId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "staff",
          filter: `id=eq.${staffData.staffId}`,
        },
        (payload) => {
          if (payload.new.is_active === false) {
            stopScanner();
            setIsDeactivated(true);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [staffData]);

  const checkAccess = async () => {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Check if user is staff
      const { data: staffRecord } = await supabase
        .from("staff")
        .select("id, business_id, role, name, is_active")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (!staffRecord) {
        // Check if staff exists but is deactivated
        const { data: inactiveRecord } = await supabase
          .from("staff")
          .select("id, name")
          .eq("user_id", user.id)
          .eq("is_active", false)
          .maybeSingle();

        if (inactiveRecord) {
          setIsDeactivated(true);
          setIsLoading(false);
          return;
        }

        // Check if owner
        const { data: business } = await supabase
          .from("businesses")
          .select("id, name, pesos_per_point")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (business) {
          setStaffData({
            staffId: user.id,
            businessId: business.id,
            businessName: business.name,
            userName:
              user.user_metadata?.full_name ||
              user.email?.split("@")[0] ||
              "Owner",
            pesosPerPoint: business.pesos_per_point || 10,
          });
          setIsLoading(false);
          return;
        }

        router.push("/login");
        return;
      }

      // Get business info
      const { data: business } = await supabase
        .from("businesses")
        .select("name, pesos_per_point")
        .eq("id", staffRecord.business_id)
        .single();

      setStaffData({
        staffId: staffRecord.id,
        businessId: staffRecord.business_id,
        businessName: business?.name || "Business",
        userName: staffRecord.name || user.user_metadata?.full_name || "Staff",
        pesosPerPoint: business?.pesos_per_point || 10,
      });

      await loadTodayStats(staffRecord.id);
      setIsLoading(false);
    } catch (err) {
      console.error("Access check error:", err);
      router.push("/login");
    }
  };

  const loadTodayStats = async (staffId: string) => {
    const supabase = createClient();
    const today = new Date().toISOString().split("T")[0];

    const { data } = await supabase
      .from("scan_logs")
      .select("points_awarded")
      .eq("staff_id", staffId)
      .gte("scanned_at", today);

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
    setScannerState("scanning");
    setError("");

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
        err instanceof Error ? err.message : "Failed to start camera";
      setError(message);
      setScannerState("error");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error("Scanner stop error:", err);
      }
    }
  };

  const switchCamera = async () => {
    await stopScanner();
    const newFacing = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(newFacing);
    setTimeout(() => startScannerWithFacing(newFacing), 300);
  };

  const startScannerWithFacing = async (facing: "environment" | "user") => {
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
      console.error("Scanner restart error:", err);
    }
  };

  const onScanSuccess = useCallback(async (decodedText: string) => {
    await stopScanner();
    await lookupCustomer(decodedText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================
  // CUSTOMER LOOKUP
  // ============================================

  const lookupCustomer = async (scannedCode: string) => {
    const supabase = createClient();

    try {
      const { data: rpcResult } = await supabase.rpc("lookup_customer_by_qr", {
        p_scanned_code: scannedCode,
      });

      let customerData =
        rpcResult && rpcResult.length > 0 ? rpcResult[0] : null;

      if (!customerData) {
        setError("Customer not found. Please try again.");
        setScannerState("error");
        return;
      }

      // Lazy card token generation for mobile-created customers
      if (!customerData.card_token && staffData) {
        try {
          const response = await fetch("/api/staff/customer/card-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ customerId: customerData.id }),
          });
          if (response.ok) {
            const result = await response.json();
            customerData.card_token = result.cardToken;
          }
        } catch {
          // Non-critical
        }
      }

      // Set created_by_business_id if null (mobile-created customers)
      if (!customerData.created_by_business_id && staffData) {
        await supabase
          .from("customers")
          .update({ created_by_business_id: staffData.businessId })
          .eq("id", customerData.id)
          .is("created_by_business_id", null);
      }

      // Auto-link customer to business + detect first visit
      let isFirstVisit = false;
      if (staffData) {
        const { data: existingLink } = await supabase
          .from("customer_businesses")
          .select("id")
          .eq("customer_id", customerData.id)
          .eq("business_id", staffData.businessId)
          .maybeSingle();

        if (!existingLink) {
          isFirstVisit = true;
          await supabase.from("customer_businesses").insert({
            customer_id: customerData.id,
            business_id: staffData.businessId,
          });
        }
      }

      // Get customer name
      let customerName = customerData.full_name || "";

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

      const tier = (customerData.tier as TierKey) || "bronze";

      setCustomer({
        id: customerData.id,
        name: customerName,
        email: customerData.email || "",
        currentPoints: customerData.total_points || 0,
        lifetimePoints: customerData.lifetime_points || 0,
        tier,
        isFirstVisit,
      });

      setScannerState("customer-found");
    } catch (err) {
      console.error("Customer lookup error:", err);
      setError("Failed to find customer. Please try again.");
      setScannerState("error");
    }
  };

  // ============================================
  // COMPLETE SALE
  // ============================================

  const handleCompleteSale = async () => {
    if (!customer || !staffData) return;

    setScannerState("processing");
    try {
      const result = await pos.completeSale();
      setSaleResult(result);

      // Update stats
      setStats((prev) => ({
        scansToday: prev.scansToday + 1,
        pointsAwardedToday: prev.pointsAwardedToday + result.points_earned,
      }));

      setScannerState("success");
    } catch (err) {
      console.error("Complete sale error:", err);
      setError(err instanceof Error ? err.message : "Failed to complete sale");
      setScannerState("error");
    }
  };

  // ============================================
  // RESET & LOGOUT
  // ============================================

  const resetScanner = () => {
    setCustomer(null);
    setSaleResult(null);
    setError("");
    setScannerState("idle");
    pos.reset();
  };

  const handleLogout = async () => {
    await stopScanner();
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.replace("/login");
  };

  const handleRedemptionCompleted = (
    customerName: string,
    pointsUsed: number,
  ) => {
    setSaleResult({
      sale_id: "",
      sale_number: "",
      subtotal_centavos: 0,
      discount_centavos: 0,
      exchange_centavos: 0,
      total_centavos: 0,
      points_earned: pointsUsed,
      points_redeemed: 0,
      new_points_balance: 0,
      tier_multiplier: 1,
      base_points: pointsUsed,
    });
    setScannerState("success");
  };

  // ============================================
  // RENDER: LOADING
  // ============================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-gray-900 animate-spin" />
      </div>
    );
  }

  // ============================================
  // RENDER: DEACTIVATED
  // ============================================

  if (isDeactivated) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldOff className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Account Deactivated
          </h2>
          <p className="text-gray-500 mb-6">
            Your account has been deactivated by the business owner. You can no
            longer scan customers.
          </p>
          <button
            onClick={handleLogout}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: MAIN
  // ============================================

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-gray-200 bg-[#7F0404]">
        <div>
          <h1 className="text-lg font-bold text-white">
            {staffData?.businessName}
          </h1>
          <p className="text-sm text-white/70">
            Cashier: {staffData?.userName}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Logout"
        >
          <LogOut className="w-5 h-5 text-white/80" />
        </button>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-32">
        {/* IDLE STATE */}
        {scannerState === "idle" && (
          <IdleView
            onStartScanner={startScanner}
            onAddCustomer={() => setIsAddCustomerModalOpen(true)}
            onVerifyCode={() => setScannerState("verify-redemption")}
          />
        )}

        {/* VERIFY REDEMPTION STATE */}
        {scannerState === "verify-redemption" && staffData && (
          <VerifyRedemptionView
            businessId={staffData.businessId}
            onCancel={resetScanner}
            onRedemptionCompleted={handleRedemptionCompleted}
          />
        )}

        {/* SCANNING STATE */}
        {scannerState === "scanning" && (
          <ScannerView
            scannerContainerId={scannerContainerId}
            onSwitchCamera={switchCamera}
            onCancel={() => {
              stopScanner();
              setScannerState("idle");
            }}
          />
        )}

        {/* CUSTOMER FOUND STATE — Full POS */}
        {scannerState === "customer-found" && customer && staffData && (
          <div className="max-w-sm mx-auto">
            <CustomerInfoBar
              name={customer.name}
              currentPoints={customer.currentPoints}
              tier={customer.tier}
              isFirstVisit={customer.isFirstVisit}
            />

            {/* Product Selector (hidden if no POS module) */}
            {pos.hasPOSModule && !pos.isLoadingProducts && (
              <ProductSelector
                products={pos.products}
                onAddToCart={pos.addProduct}
                disabled={pos.isProcessing}
              />
            )}

            {pos.isLoadingProducts && pos.hasPOSModule && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                <span className="text-sm text-gray-500">
                  Loading products...
                </span>
              </div>
            )}

            <CartSection
              items={pos.cartItems}
              onUpdateQuantity={pos.updateQuantity}
              onRemoveItem={pos.removeItem}
              onAddManualItem={pos.addManualItem}
              subtotalCentavos={pos.subtotalCentavos}
            />

            {pos.subtotalCentavos > 0 && (
              <>
                <DiscountSection
                  subtotalCentavos={pos.subtotalCentavos}
                  discount={pos.discount}
                  onDiscountChange={pos.setDiscount}
                />

                <ExchangeSection
                  customerPoints={customer.currentPoints}
                  pesosPerPoint={staffData.pesosPerPoint}
                  maxExchangePoints={pos.maxExchangePoints}
                  currentExchangePoints={pos.exchange?.pointsUsed || 0}
                  onExchangeChange={pos.setExchange}
                />

                <OrderSummary
                  subtotalCentavos={pos.subtotalCentavos}
                  discountCentavos={pos.discountCentavos}
                  exchangeCentavos={pos.exchangeCentavos}
                  totalDueCentavos={pos.totalDueCentavos}
                  basePointsToEarn={pos.basePointsToEarn}
                  pointsToEarn={pos.pointsToEarn}
                  tierMultiplier={pos.tierMultiplier}
                  customerTier={customer.tier}
                  pesosPerPoint={staffData.pesosPerPoint}
                  cartItemCount={pos.cartItems.length}
                  isProcessing={pos.isProcessing}
                  onComplete={handleCompleteSale}
                />
              </>
            )}

            {/* Cancel button */}
            <button
              onClick={resetScanner}
              className="w-full mt-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors text-gray-700 border border-gray-300"
            >
              Cancel
            </button>
          </div>
        )}

        {/* PROCESSING STATE */}
        {scannerState === "processing" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
            <p className="text-gray-500">Processing sale...</p>
          </div>
        )}

        {/* SUCCESS STATE */}
        {scannerState === "success" && saleResult && (
          <div className="max-w-sm mx-auto text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900">
              {saleResult.points_redeemed > 0 ? "Sale Complete!" : "Points Awarded!"}
            </h2>
            {customer && (
              <p className="text-gray-500 mb-6">{customer.name}</p>
            )}

            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
              {/* Sale total (if actual sale) */}
              {saleResult.subtotal_centavos > 0 && (
                <div className="mb-4 pb-4 border-b border-gray-200 space-y-1">
                  {saleResult.discount_centavos > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Discount</span>
                      <span className="text-green-600">
                        -₱{(saleResult.discount_centavos / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {saleResult.exchange_centavos > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Points Payment</span>
                      <span className="text-yellow-600">
                        -₱{(saleResult.exchange_centavos / 100).toFixed(2)} ({saleResult.points_redeemed} pts)
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold">
                    <span className="text-gray-900">Total Due</span>
                    <span className="text-gray-900">
                      ₱{(saleResult.total_centavos / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Points earned */}
              <p className="text-5xl font-bold text-yellow-600 mb-2">
                +{saleResult.points_earned.toLocaleString()}
              </p>
              <p className="text-gray-500">points earned</p>

              {/* Tier bonus breakdown */}
              {saleResult.tier_multiplier > 1 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Base points</span>
                    <span className="text-gray-700">
                      {saleResult.base_points.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-600">
                      Tier bonus ({saleResult.tier_multiplier}x)
                    </span>
                    <span className="text-amber-600">
                      +{(saleResult.points_earned - saleResult.base_points).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {saleResult.new_points_balance > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">New Balance</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {saleResult.new_points_balance.toLocaleString()} points
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={resetScanner}
              className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 rounded-xl font-semibold hover:shadow-lg transition-all text-gray-900 border border-gray-900"
            >
              Scan Next Customer
            </button>
          </div>
        )}

        {/* ERROR STATE */}
        {scannerState === "error" && (
          <div className="max-w-sm mx-auto text-center">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-red-600">Error</h2>
            <p className="text-gray-500 mb-6">
              {error || "Something went wrong. Please try again."}
            </p>
            <button
              onClick={resetScanner}
              className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 rounded-xl font-semibold hover:shadow-lg transition-all text-gray-900 border border-gray-900"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Add Customer Modal */}
        <AddCustomerModal
          isOpen={isAddCustomerModalOpen}
          onClose={() => setIsAddCustomerModalOpen(false)}
          businessName={staffData?.businessName || "Business"}
        />
      </main>

      {/* Footer Stats */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 p-4">
        <div className="max-w-sm mx-auto">
          <p className="text-xs text-gray-500 text-center mb-2">
            Today&apos;s Activity
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <User className="w-4 h-4 text-yellow-600" />
                <span className="text-xl font-bold text-gray-900">
                  {stats.scansToday}
                </span>
              </div>
              <p className="text-xs text-gray-500">Customers Scanned</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Award className="w-4 h-4 text-yellow-600" />
                <span className="text-xl font-bold text-gray-900">
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
