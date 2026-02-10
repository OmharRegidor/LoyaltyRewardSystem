'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Package, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/dashboard/pos', label: 'Register', icon: ShoppingCart },
  { href: '/dashboard/pos/products', label: 'Products', icon: Package },
  { href: '/dashboard/pos/analytics', label: 'Analytics', icon: BarChart3 },
];

export function POSNavTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
