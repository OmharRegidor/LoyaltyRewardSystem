// apps/web/app/staff/page.tsx

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  AlertCircle,
  Loader2,
  User,
  Award,
  ShieldOff,
  ShoppingCart,
  LayoutGrid,
  Monitor,
  Search,
  Tag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { Html5Qrcode } from "html5-qrcode";
import type { TierKey, StaffSaleResult } from "@/types/staff-pos.types";
import { useStaffPOS } from "@/hooks/useStaffPOS";

// Components
import { AddCustomerModal } from "@/components/staff/add-customer-modal";
import { IdleView } from "@/components/staff/idle-view";
import { ScannerView } from "@/components/staff/scanner-view";
import { VerifyRedemptionView } from "@/components/staff/verify-redemption-view";
import { ProductSelector } from "@/components/staff/pos/product-selector";
import { CartSection } from "@/components/staff/pos/cart-section";
import { DiscountModal } from "@/components/staff/pos/discount-modal";
import { PaymentPanel } from "@/components/staff/pos/payment-panel";
import { ReceiptModal } from "@/components/staff/pos/receipt-modal";
import type { PaymentMethod } from "@/types/pos.types";
import type { StaffCartItem } from "@/types/staff-pos.types";

// ============================================
// TYPES
// ============================================

interface StaffData {
  staffId: string;
  businessId: string;
  businessName: string;
  userName: string;
  pesosPerPoint: number;
  minPurchaseForPoints: number;
  maxPointsPerTransaction: number | null;
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
// ANIMATION VARIANTS
// ============================================

const fadeSlide = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.2 },
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
  const staffDataRef = useRef<StaffData | null>(null);
  const [stats, setStats] = useState({ scansToday: 0, pointsAwardedToday: 0 });
  const [scannerState, setScannerState] = useState<ScannerState>("idle");
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [saleResult, setSaleResult] = useState<StaffSaleResult | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">(
    "environment",
  );
  const [error, setError] = useState("");
  const [isDeactivated, setIsDeactivated] = useState(false);
  const [mobileTab, setMobileTab] = useState<"products" | "cart">("products");
  const [pendingScan, setPendingScan] = useState(false);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [paymentView, setPaymentView] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptPaymentMethod, setReceiptPaymentMethod] = useState<PaymentMethod>("cash");
  const [receiptCartItems, setReceiptCartItems] = useState<StaffCartItem[]>([]);
  const [receiptAmountTendered, setReceiptAmountTendered] = useState(0);
  const [receiptDiscountReason, setReceiptDiscountReason] = useState<string | undefined>();

  // Refs
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-scanner-container";

  // POS hook (initialized with defaults, updated when customer is found)
  const pos = useStaffPOS({
    pesosPerPoint: staffData?.pesosPerPoint || 10,
    customerPoints: customer?.currentPoints || 0,
    customerTier: customer?.tier || "bronze",
    customerId: customer?.id || "",
    businessId: staffData?.businessId,
    minPurchaseForPoints: staffData?.minPurchaseForPoints ?? 0,
    maxPointsPerTransaction: staffData?.maxPointsPerTransaction ?? null,
  });

  // ============================================
  // INITIALIZATION
  // ============================================

  useEffect(() => {
    staffDataRef.current = staffData;
  }, [staffData]);

  useEffect(() => {
    checkAccess();
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start scanner after DOM has mounted the scanner container
  useEffect(() => {
    if (!pendingScan || scannerState !== "scanning") return;

    const tryStart = async () => {
      // Poll for the container to exist (AnimatePresence exit may delay mount)
      for (let i = 0; i < 20; i++) {
        if (document.getElementById(scannerContainerId)) {
          setPendingScan(false);
          await initScanner();
          return;
        }
        await new Promise((r) => setTimeout(r, 50));
      }
      // Container never appeared
      setPendingScan(false);
      setError("Scanner container failed to load. Please try again.");
      setScannerState("error");
    };

    tryStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingScan, scannerState]);

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

      // Check active staff, inactive staff, and business owner in parallel
      const [{ data: staffRecord }, { data: inactiveRecord }, { data: ownerBusiness }] = await Promise.all([
        supabase
          .from("staff")
          .select("id, business_id, role, name, is_active")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle(),
        supabase
          .from("staff")
          .select("id, name")
          .eq("user_id", user.id)
          .eq("is_active", false)
          .maybeSingle(),
        supabase
          .from("businesses")
          .select("id, name, pesos_per_point, min_purchase_for_points, max_points_per_transaction")
          .eq("owner_id", user.id)
          .maybeSingle(),
      ]);

      if (staffRecord) {
        // Active staff — fetch business info
        const { data: business } = await supabase
          .from("businesses")
          .select("name, pesos_per_point, min_purchase_for_points, max_points_per_transaction")
          .eq("id", staffRecord.business_id)
          .single();

        setStaffData({
          staffId: staffRecord.id,
          businessId: staffRecord.business_id,
          businessName: business?.name || "Business",
          userName: staffRecord.name || user.user_metadata?.full_name || "Staff",
          pesosPerPoint: business?.pesos_per_point || 10,
          minPurchaseForPoints: business?.min_purchase_for_points ?? 0,
          maxPointsPerTransaction: business?.max_points_per_transaction ?? null,
        });

        await loadTodayStats(staffRecord.id);
      } else if (inactiveRecord) {
        setIsDeactivated(true);
      } else if (ownerBusiness) {
        setStaffData({
          staffId: user.id,
          businessId: ownerBusiness.id,
          businessName: ownerBusiness.name,
          userName:
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "Owner",
          pesosPerPoint: ownerBusiness.pesos_per_point || 10,
          minPurchaseForPoints: ownerBusiness.min_purchase_for_points ?? 0,
          maxPointsPerTransaction: ownerBusiness.max_points_per_transaction ?? null,
        });
      } else {
        router.push("/login");
        return;
      }
      setIsLoading(false);
    } catch (err) {
      console.error("Access check error:", err);
      router.push("/login");
    }
  };

  const loadTodayStats = async (staffId: string) => {
    const supabase = createClient();
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
    const startOfDayPHT = `${today}T00:00:00+08:00`;

    const { data } = await supabase
      .from("scan_logs")
      .select("points_awarded")
      .eq("staff_id", staffId)
      .gte("scanned_at", startOfDayPHT);

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

  const startScanner = () => {
    setScannerState("scanning");
    setError("");
    setPendingScan(true);
  };

  const initScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;

      const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 };

      try {
        await html5QrCode.start(
          { facingMode: cameraFacing },
          config,
          onScanSuccess,
          () => {},
        );
      } catch {
        // Fallback: try any available camera if preferred facing mode fails
        const devices = await Html5Qrcode.getCameras();
        if (devices.length > 0) {
          await html5QrCode.start(
            devices[0].id,
            config,
            onScanSuccess,
            () => {},
          );
        } else {
          throw new Error("No camera found on this device");
        }
      }
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

      const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 };

      try {
        await html5QrCode.start(
          { facingMode: facing },
          config,
          onScanSuccess,
          () => {},
        );
      } catch {
        const devices = await Html5Qrcode.getCameras();
        if (devices.length > 0) {
          await html5QrCode.start(
            devices[0].id,
            config,
            onScanSuccess,
            () => {},
          );
        }
      }
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
    const businessId = staffDataRef.current?.businessId ?? "";

    if (!businessId) {
      console.error("lookupCustomer: businessId is empty — staffDataRef.current:", staffDataRef.current);
      setError("Staff session not loaded yet. Please wait and try again.");
      setScannerState("error");
      return;
    }

    try {
      // Resolve to the correct business-specific customer record
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc("resolve_customer_for_business", {
          p_scanned_code: scannedCode,
          p_business_id: businessId,
        })
        .maybeSingle();

      if (rpcError) {
        console.error("RPC error:", rpcError.message, rpcError.code, rpcError.details, JSON.stringify(rpcError));
        setError(`Failed to look up customer: ${rpcError.message || "Unknown error"}`);
        setScannerState("error");
        return;
      }

      let customerData = rpcResult ?? null;

      // Fallback: direct DB lookup if RPC returned nothing
      if (!customerData) {
        const selectFields = "id, user_id, full_name, email, total_points, lifetime_points, tier, card_token, created_by_business_id, qr_code_url";
        const [byCode, byUrl] = await Promise.all([
          supabase.from("customers").select(selectFields).eq("qr_code_url", scannedCode).maybeSingle(),
          supabase.from("customers").select(selectFields).eq("qr_code_url", `NoxaLoyalty://customer/${scannedCode}`).maybeSingle(),
        ]);
        const fallback = byCode.data ?? byUrl.data;

        if (fallback) {
          customerData = fallback as typeof rpcResult;
        }
      }

      if (!customerData) {
        console.error(
          "Customer lookup failed — scanned:",
          scannedCode.slice(0, 20),
          "businessId:",
          businessId,
        );
        setError(`Customer not found (scanned: ${scannedCode.slice(0, 20)}…). Please try again.`);
        setScannerState("error");
        return;
      }

      // Lazy card token generation for mobile-created customers
      if (!customerData.card_token && staffDataRef.current) {
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
      if (!customerData.created_by_business_id && staffDataRef.current) {
        await supabase
          .from("customers")
          .update({ created_by_business_id: staffDataRef.current.businessId })
          .eq("id", customerData.id)
          .is("created_by_business_id", null);
      }

      // Auto-link customer to business + detect first visit
      let isFirstVisit = false;
      if (staffDataRef.current) {
        const { data: existingLink } = await supabase
          .from("customer_businesses")
          .select("id")
          .eq("customer_id", customerData.id)
          .eq("business_id", staffDataRef.current.businessId)
          .maybeSingle();

        if (!existingLink) {
          isFirstVisit = true;
          await supabase.from("customer_businesses").insert({
            customer_id: customerData.id,
            business_id: staffDataRef.current.businessId,
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

      // Fetch business-specific points
      let businessPoints = customerData.total_points || 0;
      if (staffDataRef.current) {
        const { data: bpData } = await supabase
          .from("customer_businesses")
          .select("points")
          .eq("customer_id", customerData.id)
          .eq("business_id", staffDataRef.current.businessId)
          .maybeSingle();
        if (bpData) {
          businessPoints = bpData.points || 0;
        }
      }

      setCustomer({
        id: customerData.id,
        name: customerName,
        email: customerData.email || "",
        currentPoints: businessPoints,
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

  const handleCompleteSale = async (method: PaymentMethod) => {
    if (!customer || !staffData) return;

    setReceiptPaymentMethod(method);
    setReceiptCartItems([...pos.cartItems]);
    setReceiptAmountTendered(pos.amountTenderedCentavos);
    setReceiptDiscountReason(pos.discount?.reason);

    try {
      const result = await pos.completeSale();
      setSaleResult(result);

      // Clear the cart so realtime stock updates aren't double-counted
      // (receipt snapshots already captured above)
      pos.reset();

      // Update stats
      setStats((prev) => ({
        scansToday: prev.scansToday + 1,
        pointsAwardedToday: prev.pointsAwardedToday + result.points_earned,
      }));

      setScannerState("customer-found");
      setPaymentView(false);
      setReceiptModalOpen(true);
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
    setMobileTab("products");
    setPaymentView(false);
    setReceiptModalOpen(false);
    setReceiptCartItems([]);
    setReceiptAmountTendered(0);
    setReceiptDiscountReason(undefined);
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
    resetScanner();
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

  const isCustomerFound = scannerState === "customer-found";

  return (
    <div className={`${isCustomerFound ? "h-screen flex flex-col overflow-hidden" : "min-h-screen"} bg-white text-gray-900`}>
      {/* Header */}
      {isCustomerFound ? (
        <header className="px-5 py-3 flex items-center justify-between bg-primary shadow-md">
          <div className="flex items-center gap-3">
            <Monitor className="w-5 h-5 text-secondary" />
            <div>
              <h1 className="text-base font-bold text-primary-foreground">
                {staffData?.businessName} POS
              </h1>
              <p className="text-xs text-primary-foreground/60">
                Cashier: {staffData?.userName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-primary-foreground/60 hidden sm:block">
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>
      ) : (
        <header className="p-4 flex items-center justify-between border-b border-gray-200 bg-primary shadow-md">
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
      )}

      {/* Main Content */}
      <main className={isCustomerFound ? "flex-1 min-h-0 flex flex-col" : "p-4 pb-32"}>
        <AnimatePresence mode="wait">
          {/* IDLE STATE */}
          {scannerState === "idle" && (
            <motion.div key="idle" {...fadeSlide}>
              <IdleView
                onStartScanner={startScanner}
                onAddCustomer={() => setIsAddCustomerModalOpen(true)}
                onVerifyCode={() => setScannerState("verify-redemption")}
              />
            </motion.div>
          )}

          {/* VERIFY REDEMPTION STATE */}
          {scannerState === "verify-redemption" && staffData && (
            <motion.div key="verify" {...fadeSlide}>
              <VerifyRedemptionView
                businessId={staffData.businessId}
                onCancel={resetScanner}
                onRedemptionCompleted={handleRedemptionCompleted}
              />
            </motion.div>
          )}

          {/* SCANNING STATE */}
          {scannerState === "scanning" && (
            <motion.div key="scanning" {...fadeSlide}>
              <ScannerView
                scannerContainerId={scannerContainerId}
                onSwitchCamera={switchCamera}
                onCancel={() => {
                  stopScanner();
                  setScannerState("idle");
                }}
              />
            </motion.div>
          )}

          {/* CUSTOMER FOUND STATE — Full POS */}
          {isCustomerFound && customer && staffData && (
            <motion.div key="pos" {...fadeSlide} className="flex flex-col flex-1 min-h-0">
              {/* Customer Info Banner */}
              <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-gray-200 flex-wrap">
                <div className="flex items-center gap-2 font-semibold text-gray-900">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="truncate max-w-[160px]">{customer.name}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {customer.currentPoints.toLocaleString()} pts
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                    customer.tier === "platinum"
                      ? "bg-purple-100 text-purple-700"
                      : customer.tier === "gold"
                        ? "bg-yellow-100 text-yellow-700"
                        : customer.tier === "silver"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {customer.tier}
                </span>
                {customer.isFirstVisit && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    1st visit
                  </span>
                )}
              </div>

              {/* Mobile Tab Switcher — hidden on md+ */}
              <div className="flex md:hidden border-b border-gray-200 bg-white">
                {(["products", "cart"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setMobileTab(tab)}
                    className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                      mobileTab === tab
                        ? "text-gray-900"
                        : "text-gray-500"
                    }`}
                  >
                    {tab === "products" ? (
                      <LayoutGrid className="w-4 h-4" />
                    ) : (
                      <ShoppingCart className="w-4 h-4" />
                    )}
                    {tab === "products" ? "Products" : "Cart"}
                    {tab === "cart" && pos.cartItems.length > 0 && (
                      <span className="bg-secondary text-gray-900 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {pos.cartItems.length}
                      </span>
                    )}
                    {mobileTab === tab && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Split Panel Layout — Products LEFT, Cart RIGHT */}
              <div className="flex flex-col md:flex-row flex-1 min-h-0">
                {/* LEFT PANEL — Products */}
                <div
                  className={`flex-1 bg-white md:!flex md:flex-col min-h-0 ${
                    mobileTab === "products" ? "flex flex-col" : "hidden"
                  }`}
                >
                  <div className="p-4 md:p-5 flex-1 overflow-y-auto min-h-0">
                    {pos.hasPOSModule && !pos.isLoadingProducts && (
                      <ProductSelector
                        products={pos.products}
                        cartItems={pos.cartItems}
                        onAddToCart={(product) => {
                          pos.addProduct(product);
                        }}
                        disabled={pos.isProcessing}
                      />
                    )}

                    {pos.isLoadingProducts && pos.hasPOSModule && (
                      <div className="bg-white shadow-sm rounded-xl p-4 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        <span className="text-sm text-gray-500">
                          Loading products...
                        </span>
                      </div>
                    )}

                    {!pos.hasPOSModule && (
                      <div className="bg-white shadow-sm rounded-xl p-6 text-center">
                        <p className="text-gray-500 text-sm">
                          POS module not enabled. Use manual amount entry in the Cart.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT PANEL — Cart & Checkout / Payment */}
                <div
                  className={`md:w-[350px] md:flex-none bg-gray-50 border-l border-gray-200 md:!flex md:flex-col min-h-0 ${
                    mobileTab === "cart" ? "flex flex-col flex-1" : "hidden"
                  }`}
                >
                  {paymentView ? (
                    <PaymentPanel
                      subtotalCentavos={pos.subtotalCentavos}
                      discountCentavos={pos.discountCentavos}
                      discountReason={pos.discount?.reason}
                      totalDueCentavos={pos.totalDueCentavos}
                      amountTenderedCentavos={pos.amountTenderedCentavos}
                      onTenderedChange={pos.setAmountTenderedCentavos}
                      onComplete={handleCompleteSale}
                      onBack={() => setPaymentView(false)}
                      isProcessing={pos.isProcessing}
                      pointsToEarn={pos.pointsToEarn}
                      customerTier={customer?.tier}
                    />
                  ) : (
                    <>
                      {/* Search customer placeholder */}
                      <div className="p-4 pb-2">
                        <div className="relative">
                          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            disabled
                            placeholder="Search customer..."
                            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm placeholder-gray-400 cursor-not-allowed opacity-60"
                          />
                        </div>
                      </div>

                      {/* Cart header */}
                      <div className="px-4 pb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4 text-gray-600" />
                          <h3 className="text-sm font-semibold text-gray-700">
                            Cart ({pos.cartItems.length} item{pos.cartItems.length !== 1 ? "s" : ""})
                          </h3>
                        </div>
                        {pos.cartItems.length > 0 && (
                          <button
                            onClick={() => {
                              for (const item of pos.cartItems) {
                                pos.removeItem(item.id);
                              }
                            }}
                            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                          >
                            Clear all
                          </button>
                        )}
                      </div>

                      {/* Scrollable cart area */}
                      <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-4">
                        <CartSection
                          items={pos.cartItems}
                          onUpdateQuantity={pos.updateQuantity}
                          onRemoveItem={pos.removeItem}
                          onAddManualItem={pos.addManualItem}
                          onClearAll={() => {
                            for (const item of pos.cartItems) {
                              pos.removeItem(item.id);
                            }
                          }}
                        />
                      </div>

                      {/* Bottom: totals + charge button */}
                      <div className="border-t border-gray-200 bg-white p-4 space-y-3">
                        {pos.subtotalCentavos > 0 && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Subtotal</span>
                              <span className="text-gray-700">₱{(pos.subtotalCentavos / 100).toFixed(2)}</span>
                            </div>
                            {pos.discount && (
                              <div className="flex justify-between text-sm">
                                <span className="text-green-600">
                                  {pos.discount.reason || "Discount"}
                                </span>
                                <span className="text-green-600">
                                  -₱{(pos.discountCentavos / 100).toFixed(2)}
                                </span>
                              </div>
                            )}
                            <div className="border-t border-gray-100 pt-1.5 flex justify-between text-lg font-bold">
                              <span className="text-gray-900">Total</span>
                              <span className="text-gray-900">₱{(pos.totalDueCentavos / 100).toFixed(2)}</span>
                            </div>
                            {pos.pointsToEarn > 0 && customer && (
                              <div className="flex items-center gap-1.5 text-xs text-amber-600 pt-1">
                                <span className="capitalize">{customer.tier}</span>
                                <span>•</span>
                                <span>Earn {pos.pointsToEarn} pts</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Add discount button */}
                        <button
                          onClick={() => setDiscountModalOpen(true)}
                          className="flex items-center gap-1.5 text-xs font-medium text-yellow-700 hover:text-yellow-800 transition-colors"
                        >
                          <Tag className="w-3.5 h-3.5" />
                          {pos.discount ? "Discount applied — edit" : "Add discount"}
                        </button>

                        {/* Charge button — opens payment view */}
                        <button
                          onClick={() => setPaymentView(true)}
                          disabled={pos.cartItems.length === 0 || pos.isProcessing}
                          className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between px-5"
                        >
                          {pos.isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                          ) : (
                            <>
                              <span>Charge</span>
                              <span>₱{(pos.totalDueCentavos / 100).toFixed(2)} ›</span>
                            </>
                          )}
                        </button>

                        {/* Cancel */}
                        <button
                          onClick={resetScanner}
                          className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>

                      {/* Discount Modal */}
                      <DiscountModal
                        isOpen={discountModalOpen}
                        onClose={() => setDiscountModalOpen(false)}
                        subtotalCentavos={pos.subtotalCentavos}
                        discount={pos.discount}
                        onDiscountChange={pos.setDiscount}
                      />
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* PROCESSING STATE */}
          {scannerState === "processing" && (
            <motion.div key="processing" {...fadeSlide} className="flex flex-col items-center justify-center min-h-[60vh]">
              <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
              <p className="text-gray-500">Processing sale...</p>
            </motion.div>
          )}

          {/* Receipt Modal — shown after successful payment */}
          {receiptModalOpen && saleResult && staffData && (
            <ReceiptModal
              isOpen={receiptModalOpen}
              onClose={() => setReceiptModalOpen(false)}
              onNewSale={resetScanner}
              saleResult={saleResult}
              cartItems={receiptCartItems}
              businessName={staffData.businessName}
              cashierName={staffData.userName}
              paymentMethod={receiptPaymentMethod}
              amountTenderedCentavos={receiptAmountTendered}
              discountReason={receiptDiscountReason}
            />
          )}

          {/* ERROR STATE */}
          {scannerState === "error" && (
            <motion.div key="error" {...fadeSlide} className="max-w-sm mx-auto text-center">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-red-600">Error</h2>
              <p className="text-gray-500 mb-6">
                {error || "Something went wrong. Please try again."}
              </p>
              <motion.button
                onClick={resetScanner}
                whileTap={{ scale: 0.97 }}
                className="w-full py-4 bg-secondary hover:bg-secondary/90 rounded-xl font-semibold hover:shadow-lg transition-all text-gray-900 border border-gray-900"
              >
                Try Again
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Customer Modal */}
        <AddCustomerModal
          isOpen={isAddCustomerModalOpen}
          onClose={() => setIsAddCustomerModalOpen(false)}
          businessName={staffData?.businessName || "Business"}
        />
      </main>

      {/* Footer Stats — Only when NOT in customer-found state */}
      {!isCustomerFound && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 p-4">
          <div className="max-w-screen-xl mx-auto">
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
      )}
    </div>
  );
}
