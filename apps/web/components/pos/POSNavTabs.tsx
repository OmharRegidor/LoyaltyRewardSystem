'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Package, Warehouse, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/dashboard/pos', label: 'Register', icon: ShoppingCart },
  { href: '/dashboard/pos/products', label: 'Products', icon: Package },
  { href: '/dashboard/pos/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/dashboard/pos/analytics', label: 'Analytics', icon: BarChart3 },
];

export function POSNavTabs() {
  const pathname = usePathname();

  return (
    <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-full sm:w-fit">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
