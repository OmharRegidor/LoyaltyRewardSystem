'use client';

import { useEffect, useState } from 'react';
import { IMPERSONATION_DISPLAY_COOKIE_NAME } from './impersonation-client';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith(prefix));
  if (!match) return null;
  try {
    return decodeURIComponent(match.slice(prefix.length));
  } catch {
    return null;
  }
}

export function useIsImpersonating(): boolean {
  const [impersonating, setImpersonating] = useState(false);

  useEffect(() => {
    const check = () => setImpersonating(readCookie(IMPERSONATION_DISPLAY_COOKIE_NAME) !== null);
    check();
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, []);

  return impersonating;
}
