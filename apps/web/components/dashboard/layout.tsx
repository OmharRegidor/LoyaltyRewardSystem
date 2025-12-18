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
  Sun,
  Moon,
  UsersRound,
  Menu,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { logout } from '@/lib/auth';

interface UserData {
  name: string;
  email: string;
  businessName: string;
  role: 'owner' | 'manager' | 'cashier';
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    name: '',
    email: '',
    businessName: '',
    role: 'owner',
  });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const supabase = createClient();

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          router.push('/login');
          return;
        }

        const { data: business } = await supabase
          .from('businesses')
          .select('name')
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
          role: 'owner',
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading user:', error);
        router.push('/login');
      }
    };

    loadUserData();

    // Check dark mode
    const isDark = localStorage.getItem('darkMode') !== 'false';
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [router]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  // Main navigation items
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', href: '/dashboard/customers', icon: Users },
    { name: 'Rewards', href: '/dashboard/rewards', icon: Gift },
    { name: 'Team', href: '/dashboard/settings/team', icon: UsersRound },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/dashboard/settings/team')
      return pathname === '/dashboard/settings/team';
    if (href === '/dashboard/settings')
      return pathname === '/dashboard/settings' && !pathname.includes('/team');
    return pathname.startsWith(href);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 w-64 h-full bg-gray-900 dark:bg-gray-950 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-2xl font-bold text-cyan-400 italic"
          >
            LoyaltyHub
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                isActive(item.href)
                  ? 'bg-linear-to-r from-cyan-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 space-y-2 border-t border-gray-800">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>

          {/* User Info */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-cyan-500 to-blue-500 flex items-center justify-center shrink-0">
              <span className="text-white font-bold">
                {userData.businessName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {userData.businessName}
              </p>
              <p className="text-xs text-gray-400 capitalize">
                {userData.role}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 z-30">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-gray-400 hover:text-white"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="text-lg font-bold text-cyan-400 italic">
          LoyaltyHub
        </span>
        <div className="w-10" /> {/* Spacer for centering */}
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="p-4 pt-20 lg:p-8 lg:pt-8">{children}</div>
      </main>
    </div>
  );
}
