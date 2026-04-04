'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, Warehouse, BarChart3, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/dashboard/pos/products', label: 'Products', icon: Package },
  { href: '/dashboard/pos/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/dashboard/pos/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/pos/history', label: 'History', icon: Receipt },
];

export function POSNavTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 bg-muted/50 border border-border/50 p-1.5 rounded-xl w-full sm:w-fit">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex flex-1 sm:flex-initial flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-[10px] sm:text-sm transition-all duration-200',
              isActive
                ? 'bg-background text-foreground shadow-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground font-medium'
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-full">{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
