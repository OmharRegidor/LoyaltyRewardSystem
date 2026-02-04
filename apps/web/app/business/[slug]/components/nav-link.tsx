// apps/web/app/business/[slug]/components/nav-link.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`relative px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors rounded-md group ${
        isActive
          ? 'text-foreground'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
      {/* Animated underline */}
      <span
        className={`absolute -bottom-0.5 left-2 right-2 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300 rounded-full ${
          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      />
    </Link>
  );
}
