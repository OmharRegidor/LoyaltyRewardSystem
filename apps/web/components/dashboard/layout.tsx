// apps/web/components/dashboard/layout.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Gift,
  BarChart3,
  Settings,
  LogOut,
  UsersRound,
  Menu,
  X,
  ShoppingCart,
  Lock,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubscription } from '@/hooks/useSubscription';
import { createClient } from '@/lib/supabase';
import { logout } from '@/lib/auth';
import { User } from '@supabase/supabase-js';
import { UpgradeCongratsModal } from '@/components/dashboard/upgrade-congrats-modal';

interface UserData {
  name: string;
  email: string;
  businessName: string;
  logoUrl: string | null;
  role: 'owner' | 'manager' | 'cashier';
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { subscription, isLoading: subscriptionLoading, refetch } = useSubscription();
  const hasPOS = subscription?.plan?.hasPOS ?? false;
  const showCongratsModal =
    !subscriptionLoading &&
    subscription?.upgradeAcknowledged === false &&
    subscription?.plan?.name === 'enterprise';
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    name: '',
    email: '',
    businessName: '',
    logoUrl: null,
    role: 'owner',
  });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const supabase = createClient();

        // First try getSession (reads from cookie directly)
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // If no session, try getUser as fallback
        let user: User | null = session?.user ?? null;
        if (!user) {
          const {
            data: { user: fetchedUser },
          } = await supabase.auth.getUser();
          user = fetchedUser;
        }

        if (!user) {
          router.push('/login');
          return;
        }

        const { data: business } = await supabase
          .from('businesses')
          .select('name, logo_url')
          .eq('owner_id', user.id)
          .maybeSingle();

        const metadata = user.user_metadata || {};

        setUserData({
          name:
            metadata.full_name ||
            metadata.business_name ||
            user.email?.split('@')[0] ||
            'User',
          email: user.email || '',
          businessName:
            business?.name || metadata.business_name || 'My Business',
          logoUrl: business?.logo_url || null,
          role: 'owner',
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading user:', error);
        router.push('/login');
      }
    };

    loadUserData();

    // Force light mode only - dark mode disabled
    document.documentElement.classList.remove('dark');
  }, [router]);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  // Core navigation items (always visible)
  const coreNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', href: '/dashboard/customers', icon: Users },
    { name: 'Rewards', href: '/dashboard/rewards', icon: Gift },
    { name: 'Team', href: '/dashboard/team', icon: UsersRound },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  ];

  // Full navigation — POS always visible, locked state handled on the page
  const navigation = [
    ...coreNavigation,
    { name: 'POS', href: '/dashboard/pos', icon: ShoppingCart, locked: !hasPOS },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  // While loading, show only core nav (skip feature-gated items that depend on subscription)
  const visibleNavigation = (isLoading || subscriptionLoading)
    ? [...coreNavigation, { name: 'Settings', href: '/dashboard/settings', icon: Settings }]
    : navigation;

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/dashboard/team') return pathname === '/dashboard/team';
    if (href === '/dashboard/settings')
      return pathname === '/dashboard/settings';
    if (href === '/dashboard/pos') return pathname.startsWith('/dashboard/pos');
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Black for brand presence */}
      <aside
        className={`fixed top-0 left-0 z-50 w-64 h-full bg-sidebar flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-2xl font-bold text-sidebar-primary italic"
          >
            NoxaLoyalty
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {visibleNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                isActive(item.href)
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg'
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/20'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
              {'locked' in item && item.locked && (
                <Lock className="w-3.5 h-3.5 ml-auto opacity-50" />
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 space-y-2 border-t border-sidebar-border">
          {/* User Info */}
          {isLoading ? (
            <div className="flex items-center gap-3 px-4 py-3 bg-sidebar-accent/10 rounded-xl">
              <Skeleton className="w-10 h-10 rounded-full shrink-0 bg-sidebar-accent/20" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <Skeleton className="h-4 w-24 rounded bg-sidebar-accent/20" />
                <Skeleton className="h-3 w-14 rounded bg-sidebar-accent/20" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 bg-sidebar-accent/10 rounded-xl">
              {userData.logoUrl ? (
                <img
                  src={userData.logoUrl}
                  alt={userData.businessName}
                  className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-sidebar-accent/30"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-sidebar-primary to-sidebar-accent flex items-center justify-center shrink-0">
                  <span className="text-sidebar-primary-foreground font-bold">
                    {userData.businessName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {userData.businessName}
                </p>
                <p className="text-xs text-sidebar-foreground/70 capitalize">
                  {userData.role}
                </p>
              </div>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sidebar-foreground/70 hover:text-red-300 hover:bg-sidebar-accent/20 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header - Maroon for brand consistency */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 z-30">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="text-lg font-bold text-sidebar-primary italic">
          NoxaLoyalty
        </span>
        <div className="w-10" /> {/* Spacer for centering */}
      </header>

      {/* Main Content - White background */}
      <main className="lg:ml-64 min-h-[100dvh] bg-background">
        <div className="p-4 pt-20 lg:p-8 lg:pt-8">{children}</div>
      </main>

      {/* Upgrade Congratulations Modal */}
      {showCongratsModal && (
        <UpgradeCongratsModal
          open={true}
          onDismiss={refetch}
        />
      )}
    </div>
  );
}
