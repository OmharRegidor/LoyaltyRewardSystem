'use client';

import {
  Home,
  Users,
  Gift,
  QrCode,
  BarChart3,
  Settings,
  LogOut,
  X,
  Moon,
  Sun,
  UserRound,
  CalendarDays,
  Briefcase,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)',
    ).matches;

    if (stored) {
      setIsDark(stored === 'dark');
    } else if (prefersDark) {
      setIsDark(true);
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkState = !isDark;
    setIsDark(newDarkState);

    if (newDarkState) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const navItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: Users, label: 'Customers', href: '/dashboard/customers' },
    { icon: Gift, label: 'Rewards', href: '/dashboard/rewards' },
    { icon: UserRound, label: 'Team', href: '/dashboard/team' },
    { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
    // TODO: Only show booking items if business.plan has booking feature enabled
    { icon: CalendarDays, label: 'Bookings', href: '/dashboard/booking' },
    { icon: Briefcase, label: 'Services', href: '/dashboard/booking/services' },
    { icon: Clock, label: 'Availability', href: '/dashboard/booking/availability' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <motion.div
      className="w-64 bg-card border-r border-border flex flex-col h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-border">
        <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
          NoxaLoyalty
        </h1>
        <button
          onClick={onClose}
          className="lg:hidden p-1 hover:bg-muted rounded transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                active
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-foreground hover:bg-muted',
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Dark Mode Toggle and User Profile */}
      <motion.div
        className="p-4 border-t border-border space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
          aria-label="Toggle dark mode"
        >
          <motion.div
            animate={{ rotate: isDark ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isDark ? (
              <Moon className="w-5 h-5 text-secondary" />
            ) : (
              <Sun className="w-5 h-5 text-primary" />
            )}
          </motion.div>
          <span className="text-sm font-medium flex-1 text-left">
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition cursor-pointer">
          <Avatar className="h-10 w-10">
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=business" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">Juan's Cafe</p>
            <p className="text-xs text-muted-foreground truncate">Owner</p>
          </div>
        </div>

        <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </motion.div>
    </motion.div>
  );
}
