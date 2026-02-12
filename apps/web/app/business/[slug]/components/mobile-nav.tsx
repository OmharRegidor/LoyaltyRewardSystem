// apps/web/app/business/[slug]/components/mobile-nav.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Home, Gift, CreditCard, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface MobileNavProps {
  slug: string;
  businessName: string;
  hasBooking: boolean;
}

const navItems = [
  { label: 'About', path: '', icon: Home },
  { label: 'My Bookings', path: '/my-bookings', icon: CalendarDays },
  { label: 'Rewards', path: '/rewards', icon: Gift },
  { label: 'Get Card', path: '/card', icon: CreditCard },
];

export function MobileNav({ slug, businessName, hasBooking }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const basePath = `/business/${slug}`;

  const filteredNavItems = !hasBooking
    ? navItems.filter((item) => item.path !== '/my-bookings')
    : navItems;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] sm:w-[320px]">
        <SheetHeader>
          <SheetTitle>{businessName}</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-2 mt-6">
          {filteredNavItems.map((item) => {
            const href = `${basePath}${item.path}`;
            const isActive = pathname === href;
            const Icon = item.icon;

            return (
              <Link
                key={item.path || 'home'}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
