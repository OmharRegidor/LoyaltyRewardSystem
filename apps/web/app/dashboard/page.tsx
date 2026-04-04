// apps/web/app/dashboard/page.tsx

'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/layout';
import {
  Users,
  TrendingUp,
  Gift,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  ChevronRight,
  ChevronLeft,
  X,
  Package,
  Copy,
  Check,
  Search,
  ArrowLeftRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import { OnboardingBanner } from '@/components/dashboard/onboarding-banner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================
// TYPES
// ============================================

interface Stats {
  totalCustomers: number;
  customersGrowth: number;
  pointsIssuedToday: number;
  pointsGrowth: number;
  activeRewards: number;
  rewardsGrowth: number;
  revenueThisMonth: number;
  revenueGrowth: number;
}

interface Transaction {
  id: string;
  customer: string;
  action: string;
  points: number;
  time: string;
  type: string;
}

interface TopReward {
  name: string;
  redemptions: number;
  percentage: number;
}

interface StatCardProps {
  title: string;
  value: string;
  growth: number;
  icon: React.ReactNode;
  iconBg: string;
}

// ============================================
// STAT CARD COMPONENT
// ============================================

function StatCard({ title, value, growth, icon, iconBg }: StatCardProps) {
  const isPositive = growth >= 0;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-card border border-border/50 hover:shadow-card-hover transition-shadow duration-300">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}
        >
          {icon}
        </div>
        <div
          className={`flex items-center gap-1 text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-500'}`}
        >
          {isPositive ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}
          {Math.abs(growth)}%
        </div>
      </div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">{title}</p>
      <p className="font-display text-2xl font-bold tabular-nums tracking-tight text-foreground mb-1">
        {value}
      </p>
      <p className="text-xs text-muted-foreground">
        {isPositive ? 'Increase' : 'Decrease'} from last month
      </p>
    </div>
  );
}

// ============================================
// WELCOME MODAL COMPONENT
// ============================================

function WelcomeModalContent({ onClose, slug }: { onClose: () => void; slug: string | null }) {
  const [copied, setCopied] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const appHost = new URL(appUrl).host;
  const publicUrl = slug ? `${appHost}/business/${slug}` : null;

  const handleCopy = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(`https://${publicUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl p-5 sm:p-8 max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🎉</div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Welcome to NoxaLoyalty!
          </h2>
          <p className="text-green-600 font-semibold mb-2">
            Your Free plan is now active.
          </p>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            You have access to our full loyalty and rewards system.
          </p>

          {/* Public business link */}
          {publicUrl && (
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-gray-200 text-left">
              <p className="text-sm font-semibold text-gray-700 mb-2">Your public business page</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-white rounded-lg px-3 py-2 border border-gray-200 text-gray-800 truncate">
                  {publicUrl}
                </code>
                <button
                  onClick={handleCopy}
                  className="shrink-0 p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Share this link on your socials so customers can view your loyalty rewards!
              </p>
            </div>
          )}

          {/* Enterprise upsell */}
          <div className="bg-gradient-to-r from-primary/5 to-secondary/10 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-primary/10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Package className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-gray-700">
                Want Stamp Card, POS + Inventory?
              </p>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Upgrade to Enterprise for Stamp Card, POS, Inventory, and more.
            </p>
            <Link
              href="/dashboard/settings"
              className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
            >
              View Plans <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}

// Component that handles welcome param detection (uses useSearchParams)
function WelcomeModalHandler({ businessSlug }: { businessSlug: string | null }) {
  const searchParams = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (searchParams.get('welcome') === 'true') {
      setShowWelcome(true);
      // Remove query param from URL without page reload
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams]);

  if (!showWelcome) return null;

  return <WelcomeModalContent onClose={() => setShowWelcome(false)} slug={businessSlug} />;
}

// ============================================
// TRANSACTIONS MODAL
// ============================================

interface FullTransaction {
  id: string;
  type: string;
  points: number;
  description: string | null;
  created_at: string;
  customer: { full_name: string } | null;
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';

const MODAL_PAGE_SIZE = 20;

function TransactionsModal({
  open,
  onOpenChange,
  businessId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string | null;
}) {
  const [allTx, setAllTx] = useState<FullTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sort, setSort] = useState<SortOption>('newest');
  const [page, setPage] = useState(0);

  // Fetch transactions when modal opens
  useEffect(() => {
    if (!open || !businessId) return;

    setIsLoading(true);
    const fetchAll = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('transactions')
        .select(
          'id, type, points, description, created_at, customer:customers(full_name)',
        )
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(500);

      if (data) setAllTx(data as FullTransaction[]);
      setIsLoading(false);
    };

    fetchAll();
  }, [open, businessId]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [search, typeFilter, sort]);

  const filtered = useMemo(() => {
    let result = [...allTx];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((tx) =>
        (tx.customer?.full_name || '').toLowerCase().includes(q),
      );
    }

    if (typeFilter !== 'all') {
      result = result.filter((tx) => tx.type === typeFilter);
    }

    switch (sort) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'highest':
        result.sort((a, b) => b.points - a.points);
        break;
      case 'lowest':
        result.sort((a, b) => a.points - b.points);
        break;
    }

    return result;
  }, [allTx, search, typeFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / MODAL_PAGE_SIZE));
  const paged = filtered.slice(page * MODAL_PAGE_SIZE, (page + 1) * MODAL_PAGE_SIZE);

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('');

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  const typeBadge = (type: string) => {
    if (type === 'earn') {
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Earn</span>;
    }
    if (type === 'redeem') {
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">Redeem</span>;
    }
    return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{type}</span>;
  };

  const formatPoints = (type: string, points: number) => {
    const value = type === 'earn' ? points : -points;
    return (
      <span className={`font-semibold ${value >= 0 ? 'text-green-600' : 'text-gray-900'}`}>
        {value >= 0 ? '+' : ''}{value.toLocaleString()}
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold tracking-tight">Transaction History</DialogTitle>
          <DialogDescription>View and filter all transactions for your business.</DialogDescription>
        </DialogHeader>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 rounded-xl pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="earn">Earn</SelectItem>
              <SelectItem value="redeem">Redeem</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Most Recent</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="highest">Highest Points</SelectItem>
              <SelectItem value="lowest">Lowest Points</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mx-auto mb-4">
                <ArrowLeftRight className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="font-display font-semibold text-foreground">No transactions found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search || typeFilter !== 'all'
                  ? 'Try adjusting your filters.'
                  : 'Transactions will appear here once customers earn or redeem points.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Customer</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Type</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 text-right">Points</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Description</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((tx) => (
                      <TableRow key={tx.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                              {getInitials(tx.customer?.full_name || '?')}
                            </div>
                            <span className="font-medium text-foreground">
                              {tx.customer?.full_name || 'Unknown'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{typeBadge(tx.type)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatPoints(tx.type, tx.points)}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[180px] truncate">{tx.description || '-'}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">{formatDate(tx.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden space-y-3 py-2">
                {paged.map((tx) => (
                  <div key={tx.id} className="rounded-xl border border-border/50 p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                        {getInitials(tx.customer?.full_name || '?')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-foreground truncate">{tx.customer?.full_name || 'Unknown'}</span>
                          <span className="tabular-nums">{formatPoints(tx.type, tx.points)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          {typeBadge(tx.type)}
                          <span className="text-xs text-muted-foreground shrink-0">{formatDate(tx.created_at)}</span>
                        </div>
                        {tx.description && (
                          <p className="text-xs text-muted-foreground mt-2 truncate">{tx.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <p className="text-sm text-muted-foreground tabular-nums">
              {page * MODAL_PAGE_SIZE + 1}–{Math.min((page + 1) * MODAL_PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

// Default empty state values
const DEFAULT_STATS: Stats = {
  totalCustomers: 0,
  customersGrowth: 0,
  pointsIssuedToday: 0,
  pointsGrowth: 0,
  activeRewards: 0,
  rewardsGrowth: 0,
  revenueThisMonth: 0,
  revenueGrowth: 0,
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [topRewards, setTopRewards] = useState<TopReward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);
  const [pesosPerPoint, setPesosPerPoint] = useState<number | null>(null);
  const [referralRewardPoints, setReferralRewardPoints] = useState<number | null>(null);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      // Set current date
      const date = new Date();
      setCurrentDate(
        date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      );

      const supabase = createClient();

      // Get user info
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const metadata = user.user_metadata || {};
        const { data: business } = await supabase
          .from('businesses')
          .select('id, name, slug, subscription_status, pesos_per_point, referral_reward_points')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (business) {
          setBusinessId(business.id);
          setBusinessSlug(business.slug);
          setPesosPerPoint(business.pesos_per_point);
          setReferralRewardPoints(business.referral_reward_points);
          setUserName(
            business.name || metadata.business_name || 'Your Business',
          );

          // Load real-time data for all users
          await loadRealTimeData(supabase, business.id);
        }
      }

      setIsLoading(false);
    };

    loadData();
  }, []);

  // Set up real-time subscription for all users
  useEffect(() => {
    if (!businessId) return;

    const supabase = createClient();

    // Subscribe to real-time transaction updates
    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          // Reload data when new transaction comes in
          loadRealTimeData(supabase, businessId);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId]);

  const loadRealTimeData = async (
    supabase: ReturnType<typeof createClient>,
    businessId: string,
  ) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Run all 5 independent queries in parallel
      const [
        { count: customerCount },
        { count: rewardsCount },
        { data: todayTransactions },
        { data: recentTx },
        { data: topRewardsData },
      ] = await Promise.all([
        // Get total customers
        supabase
          .from('customer_businesses')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessId),
        // Get active rewards count
        supabase
          .from('rewards')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .eq('is_active', true)
          .eq('is_visible', true),
        // Get today's points issued
        supabase
          .from('transactions')
          .select('points')
          .eq('business_id', businessId)
          .gte('created_at', today.toISOString())
          .eq('type', 'earn'),
        // Get recent transactions
        supabase
          .from('transactions')
          .select(
            `
            id,
            type,
            points,
            created_at,
            customer:customers(full_name)
          `,
          )
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })
          .limit(5),
        // Get top redeemed rewards
        supabase
          .from('redemptions')
          .select(
            `
            reward_id,
            rewards(title)
          `,
          )
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

      const pointsToday =
        todayTransactions?.reduce((sum, t) => sum + (t.points || 0), 0) || 0;

      // Process top rewards
      const rewardCounts: Record<string, { name: string; count: number }> = {};
      topRewardsData?.forEach(
        (r: { reward_id: string; rewards: { title: string } | null }) => {
          const name = r.rewards?.title || 'Unknown';
          if (!rewardCounts[r.reward_id]) {
            rewardCounts[r.reward_id] = { name, count: 0 };
          }
          rewardCounts[r.reward_id].count++;
        },
      );

      const sortedRewards = Object.values(rewardCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      const totalRedemptions = sortedRewards.reduce(
        (sum, r) => sum + r.count,
        0,
      );

      // Update state with real data
      setStats({
        totalCustomers: customerCount || 0,
        customersGrowth: 0, // TODO: Calculate actual growth
        pointsIssuedToday: pointsToday,
        pointsGrowth: 0,
        activeRewards: rewardsCount || 0,
        rewardsGrowth: 0,
        revenueThisMonth: 0, // TODO: Implement revenue tracking
        revenueGrowth: 0,
      });

      // Transform transactions
      if (recentTx) {
        const transformedTx: Transaction[] = recentTx
          .filter((tx) => tx.created_at)
          .map((tx) => ({
            id: tx.id,
            customer: tx.customer?.full_name || 'Unknown',
            action:
              tx.type === 'earn'
                ? 'Points Earned'
                : tx.type === 'redeem'
                  ? 'Reward Redeemed'
                  : 'Transaction',
            points: tx.type === 'earn' ? tx.points || 0 : -(tx.points || 0),
            time: formatRelativeTime(tx.created_at!),
            type: tx.type,
          }));
        setTransactions(transformedTx);
      }

      // Transform top rewards
      const transformedRewards: TopReward[] = sortedRewards.map((r) => ({
        name: r.name,
        redemptions: r.count,
        percentage:
          totalRedemptions > 0
            ? Math.round((r.count / totalRedemptions) * 100)
            : 0,
      }));
      setTopRewards(transformedRewards);
    } catch (error) {
      console.error('Error loading real-time data:', error);
    }
  };

  const getActionBadge = (type: string, action: string) => {
    switch (type) {
      case 'earn':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            {action}
          </span>
        );
      case 'redeem':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
            {action}
          </span>
        );
      case 'bonus':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary/30 text-gray-700">
            {action}
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            {action}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-5 sm:space-y-6 overflow-hidden">
          {/* Header skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Skeleton className="h-7 w-36 rounded-lg" />
              <Skeleton className="h-5 w-56 mt-2 rounded-lg" />
            </div>
            <div className="text-right">
              <Skeleton className="h-4 w-20 ml-auto rounded-lg" />
              <Skeleton className="h-6 w-48 mt-1 ml-auto rounded-lg" />
            </div>
          </div>

          {/* Stat cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-card border border-border/50">
                <div className="flex items-start justify-between mb-3">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
                <Skeleton className="h-3 w-24 mb-1.5 rounded-lg" />
                <Skeleton className="h-7 w-20 mb-1 rounded-lg" />
                <Skeleton className="h-3 w-32 rounded-lg" />
              </div>
            ))}
          </div>

          {/* Two column layout skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Recent transactions skeleton */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-border/50">
              <div className="p-5 sm:p-6 border-b border-border/50 flex items-center justify-between">
                <Skeleton className="h-6 w-44 rounded-lg" />
                <Skeleton className="h-5 w-20 rounded-lg" />
              </div>
              <div className="divide-y divide-border/50">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="px-5 sm:px-6 py-4 flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32 rounded-lg" />
                      <Skeleton className="h-3 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>

            {/* Top rewards skeleton */}
            <div className="bg-white rounded-2xl shadow-card border border-border/50">
              <div className="p-5 sm:p-6 border-b border-border/50">
                <Skeleton className="h-6 w-44 rounded-lg" />
                <Skeleton className="h-4 w-24 mt-1 rounded-lg" />
              </div>
              <div className="p-5 sm:p-6 space-y-5">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-xl" />
                        <Skeleton className="h-4 w-28 rounded-lg" />
                      </div>
                      <Skeleton className="h-4 w-8 rounded-lg" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Welcome Modal for new signups (wrapped in Suspense for useSearchParams) */}
      <Suspense fallback={null}>
        <WelcomeModalHandler businessSlug={businessSlug} />
      </Suspense>

      {/* Onboarding Banner for new businesses */}
      <OnboardingBanner
        activeRewardCount={stats.activeRewards}
        pesosPerPoint={pesosPerPoint}
        referralRewardPoints={referralRewardPoints}
      />

      <div className="space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Welcome back to {userName}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Today&apos;s Date
            </p>
            <p className="text-sm sm:text-base font-semibold text-foreground mt-0.5">
              {currentDate}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers.toLocaleString()}
            growth={stats.customersGrowth}
            icon={<Users className="w-6 h-6 text-primary" />}
            iconBg="bg-gradient-to-br from-primary/15 to-primary/5"
          />
          <StatCard
            title="Points Issued Today"
            value={stats.pointsIssuedToday.toLocaleString()}
            growth={stats.pointsGrowth}
            icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
            iconBg="bg-gradient-to-br from-emerald-100 to-emerald-50"
          />
          <StatCard
            title="Active Rewards"
            value={stats.activeRewards.toString()}
            growth={stats.rewardsGrowth}
            icon={<Gift className="w-6 h-6 text-violet-600" />}
            iconBg="bg-gradient-to-br from-violet-100 to-violet-50"
          />
          <StatCard
            title="Revenue This Month"
            value={`₱${stats.revenueThisMonth.toLocaleString()}`}
            growth={stats.revenueGrowth}
            icon={<DollarSign className="w-6 h-6 text-amber-600" />}
            iconBg="bg-gradient-to-br from-amber-100 to-amber-50"
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent Transactions */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-border/50 hover:shadow-card-hover transition-shadow duration-300">
            <div className="p-5 sm:p-6 border-b border-border/50 flex items-center justify-between">
              <h2 className="font-display text-base sm:text-lg font-semibold tracking-tight text-foreground">
                Recent Transactions
              </h2>
              <button
                onClick={() => setShowAllTransactions(true)}
                className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Table Header - hidden on mobile */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              <div className="col-span-4">Customer</div>
              <div className="col-span-3">Action</div>
              <div className="col-span-2 text-right">Points</div>
              <div className="col-span-3 text-right">Time</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-border/50">
              {transactions.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <p className="font-display font-semibold text-foreground">
                    No transactions yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start by adding customers and issuing points.
                  </p>
                </div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="px-4 sm:px-6 py-4 hover:bg-muted/50 transition-colors"
                  >
                    {/* Mobile layout */}
                    <div className="flex sm:hidden items-center gap-3">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold text-sm">
                        {tx.customer
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-foreground truncate">
                            {tx.customer}
                          </span>
                          <span
                            className={`font-semibold tabular-nums shrink-0 ${
                              tx.points >= 0
                                ? 'text-green-600'
                                : 'text-foreground'
                            }`}
                          >
                            {tx.points >= 0 ? '+' : ''}
                            {tx.points.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          {getActionBadge(tx.type, tx.action)}
                          <span className="text-xs text-muted-foreground shrink-0">
                            {tx.time}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden sm:grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold text-sm">
                          {tx.customer
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <span className="font-medium text-foreground">
                          {tx.customer}
                        </span>
                      </div>
                      <div className="col-span-3">
                        {getActionBadge(tx.type, tx.action)}
                      </div>
                      <div
                        className={`col-span-2 text-right font-semibold tabular-nums ${
                          tx.points >= 0
                            ? 'text-green-600'
                            : 'text-foreground'
                        }`}
                      >
                        {tx.points >= 0 ? '+' : ''}
                        {tx.points.toLocaleString()}
                      </div>
                      <div className="col-span-3 text-right text-sm text-muted-foreground">
                        {tx.time}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Rewards */}
          <div className="bg-white rounded-2xl shadow-card border border-border/50 hover:shadow-card-hover transition-shadow duration-300">
            <div className="p-5 sm:p-6 border-b border-border/50">
              <h2 className="font-display text-base sm:text-lg font-semibold tracking-tight text-foreground">
                Top Rewards Redeemed
              </h2>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mt-1">
                This month
              </p>
            </div>
            <div className="p-5 sm:p-6 space-y-5">
              {topRewards.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mx-auto mb-4">
                    <Gift className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <p className="font-display font-semibold text-foreground">
                    No rewards redeemed yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create rewards to get started.
                  </p>
                </div>
              ) : (
                topRewards.map((reward, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            index === 0
                              ? 'bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600'
                              : index === 1
                                ? 'bg-gradient-to-br from-gray-100 to-gray-50 text-gray-600'
                                : index === 2
                                  ? 'bg-gradient-to-br from-orange-100 to-orange-50 text-orange-600'
                                  : 'bg-gradient-to-br from-violet-100 to-violet-50 text-violet-600'
                          }`}
                        >
                          <Star className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-sm text-foreground">
                          {reward.name}
                        </span>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {reward.redemptions}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          index === 0
                            ? 'bg-gradient-to-r from-primary to-primary/70'
                            : index === 1
                              ? 'bg-gradient-to-r from-primary/80 to-primary/60'
                              : index === 2
                                ? 'bg-gradient-to-r from-primary/60 to-primary/40'
                                : 'bg-primary/30'
                        }`}
                        style={{ width: `${reward.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Modal */}
      <TransactionsModal
        open={showAllTransactions}
        onOpenChange={setShowAllTransactions}
        businessId={businessId}
      />
    </DashboardLayout>
  );
}

// Helper function
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}
