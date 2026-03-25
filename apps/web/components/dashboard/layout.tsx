// apps/web/components/dashboard/layout.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  Users,
  Gift,
  BarChart3,
  Settings,
  LogOut,
  UsersRound,
  ShoppingCart,
  Lock,
  ChevronsLeft,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubscription } from '@/hooks/useSubscription';
import { createClient } from '@/lib/supabase';
import { logout } from '@/lib/auth';
import { User } from '@supabase/supabase-js';
import { UpgradeCongratsModal } from '@/components/dashboard/upgrade-congrats-modal';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarSeparator,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface UserData {
  name: string;
  email: string;
  businessName: string;
  logoUrl: string | null;
  role: 'owner' | 'manager' | 'cashier';
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  locked?: boolean;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const coreNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Rewards', href: '/dashboard/rewards', icon: Gift },
  { name: 'Team', href: '/dashboard/team', icon: UsersRound },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
];

function SidebarBody({
  userData,
  isLoading,
  subscriptionLoading,
  hasPOS,
}: {
  userData: UserData;
  isLoading: boolean;
  subscriptionLoading: boolean;
  hasPOS: boolean;
}) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  // Always show POS — locked state depends on subscription (default locked while loading)
  const navigation: NavItem[] = [
    ...coreNavigation,
    { name: 'POS', href: '/dashboard/pos', icon: ShoppingCart, locked: subscriptionLoading || !hasPOS },
  ];

  const settingsItem: NavItem = { name: 'Settings', href: '/dashboard/settings', icon: Settings };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/dashboard/team') return pathname === '/dashboard/team';
    if (href === '/dashboard/settings') return pathname === '/dashboard/settings';
    if (href === '/dashboard/pos') return pathname.startsWith('/dashboard/pos');
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Header — Logo */}
      <SidebarHeader className="p-3 group-data-[collapsible=icon]:p-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 min-w-0 group-data-[collapsible=icon]:justify-center"
        >
          <Image
            src="/logoloyalty.png"
            alt="NoxaLoyalty"
            width={36}
            height={36}
            className="shrink-0 rounded-lg object-contain group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8"
          />
          <span className="text-xl font-bold text-sidebar-foreground italic truncate group-data-[collapsible=icon]:hidden">
            NoxaLoyalty
          </span>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Main Navigation */}
      <SidebarContent className="overflow-x-hidden">
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase text-[11px] tracking-wider font-semibold text-sidebar-foreground/50">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.name}
                    size="default"
                    className={
                      isActive(item.href)
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground font-semibold shadow-md'
                        : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/30'
                    }
                  >
                    <Link href={item.href}>
                      <item.icon className="size-[18px]" />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.locked && !isCollapsed && (
                    <SidebarMenuBadge>
                      <Lock className="size-3.5 opacity-50" />
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Settings */}
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase text-[11px] tracking-wider font-semibold text-sidebar-foreground/50">
            General
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(settingsItem.href)}
                  tooltip={settingsItem.name}
                  size="default"
                  className={
                    isActive(settingsItem.href)
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground font-semibold shadow-md'
                      : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/30'
                  }
                >
                  <Link href={settingsItem.href}>
                    <settingsItem.icon className="size-[18px]" />
                    <span>{settingsItem.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer — User Profile + Logout */}
      <SidebarFooter className="p-2 overflow-hidden">
        <SidebarSeparator className="mb-1" />

        {/* User info */}
        {isLoading ? (
          <div className="flex items-center gap-3 p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
            <Skeleton className="size-8 rounded-full shrink-0 bg-sidebar-accent/20" />
            <div className="flex-1 min-w-0 space-y-1.5 group-data-[collapsible=icon]:hidden">
              <Skeleton className="h-3.5 w-24 rounded bg-sidebar-accent/20" />
              <Skeleton className="h-3 w-14 rounded bg-sidebar-accent/20" />
            </div>
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1.5 group-data-[collapsible=icon]:bg-transparent">
                {userData.logoUrl ? (
                  <div className="size-8 shrink-0 rounded-full overflow-hidden ring-1 ring-sidebar-accent/30">
                    <img
                      src={userData.logoUrl}
                      alt={userData.businessName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="size-8 rounded-full bg-linear-to-br from-sidebar-primary to-sidebar-accent flex items-center justify-center shrink-0">
                    <span className="text-sidebar-primary-foreground font-bold text-xs leading-none">
                      {userData.businessName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {userData.businessName}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60 capitalize truncate">
                    {userData.role}
                  </p>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              align="center"
              hidden={!isCollapsed}
              className="text-xs"
            >
              <p className="font-medium">{userData.businessName}</p>
              <p className="text-muted-foreground capitalize">{userData.role}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Logout */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Logout"
              size="default"
              onClick={handleLogout}
              className="text-sidebar-foreground/60 hover:text-red-300 hover:bg-sidebar-accent/20"
            >
              <LogOut className="size-[18px]" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}

function CollapseToggle() {
  const { toggleSidebar, state } = useSidebar();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-6 z-20 hidden md:flex size-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground shadow-sm transition-all hover:shadow-md"
        >
          <ChevronsLeft
            className={`size-3.5 transition-transform duration-200 ${
              state === 'collapsed' ? 'rotate-180' : ''
            }`}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        {state === 'collapsed' ? 'Expand' : 'Collapse'} <kbd className="ml-1 text-[10px] opacity-60">Ctrl+B</kbd>
      </TooltipContent>
    </Tooltip>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { subscription, isLoading: subscriptionLoading, refetch } = useSubscription();
  const hasPOS = subscription?.plan?.hasPOS ?? false;
  const showCongratsModal =
    !subscriptionLoading &&
    subscription?.upgradeAcknowledged === false &&
    subscription?.plan?.name === 'enterprise';
  const [isLoading, setIsLoading] = useState(true);
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

        const {
          data: { session },
        } = await supabase.auth.getSession();

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

    // Force light mode only
    document.documentElement.classList.remove('dark');
  }, [router]);

  // Read the sidebar cookie so collapsed state persists across navigation
  const defaultOpen = typeof document !== 'undefined'
    ? document.cookie.split('; ').find(c => c.startsWith('sidebar_state='))?.split('=')[1] !== 'false'
    : true;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="flex min-h-svh w-full overflow-x-hidden">
        <Sidebar collapsible="icon" className="border-r border-sidebar-border overflow-hidden">
          <CollapseToggle />
          <SidebarBody
            userData={userData}
            isLoading={isLoading}
            subscriptionLoading={subscriptionLoading}
            hasPOS={hasPOS}
          />
        </Sidebar>

        <SidebarInset>
          {/* Mobile header */}
          <header className="md:hidden sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-sidebar px-4">
            <SidebarTrigger className="text-sidebar-foreground hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/20 size-8" />
            <Image
              src="/logoloyalty.png"
              alt="NoxaLoyalty"
              width={28}
              height={28}
              className="object-contain"
            />
            <span className="text-lg font-bold text-sidebar-primary italic">
              NoxaLoyalty
            </span>
          </header>

          {/* Main content — SidebarInset is already <main>, avoid nesting */}
          <div className="flex-1 bg-background">
            <div className="p-4 md:p-8">{children}</div>
          </div>
        </SidebarInset>
      </div>

      {/* Upgrade Congratulations Modal */}
      {showCongratsModal && (
        <UpgradeCongratsModal
          open={true}
          onDismiss={refetch}
        />
      )}
    </SidebarProvider>
  );
}
