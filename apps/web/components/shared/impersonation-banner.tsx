'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, LogOut, Loader2 } from 'lucide-react';
import { IMPERSONATION_DISPLAY_COOKIE_NAME } from '@/lib/impersonation-client';

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

export function ImpersonationBanner() {
  const [email, setEmail] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    const check = () => setEmail(readCookie(IMPERSONATION_DISPLAY_COOKIE_NAME));
    check();
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, []);

  // Toggle a body attribute so global CSS can mark the viewport as read-only.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (email) {
      document.body.setAttribute('data-impersonation', 'true');
      document.body.style.paddingTop = '52px';
    } else {
      document.body.removeAttribute('data-impersonation');
      document.body.style.paddingTop = '';
    }
    return () => {
      document.body.removeAttribute('data-impersonation');
      document.body.style.paddingTop = '';
    };
  }, [email]);

  // Capture-phase interceptor: block every interaction with write controls
  // (buttons, inputs, etc.) while the cursor still renders not-allowed.
  // Anchor tags and anything marked data-allow-during-impersonation pass through.
  useEffect(() => {
    if (typeof document === 'undefined' || !email) return;

    const isBlocked = (el: Element | null): boolean => {
      if (!el) return false;
      const allowed = el.closest('[data-allow-during-impersonation]');
      if (allowed) return false;
      const anchor = el.closest('a');
      if (anchor && !anchor.hasAttribute('data-write-action')) return false;
      const blocker = el.closest(
        'button, input, select, textarea, label, [role="button"], [role="menuitem"], [role="checkbox"], [role="radio"], [role="switch"], [role="tab"], [contenteditable="true"], [onclick], [data-write-action]',
      );
      return blocker !== null;
    };

    const block = (e: Event) => {
      if (!isBlocked(e.target as Element | null)) return;
      e.preventDefault();
      e.stopPropagation();
    };

    const events: (keyof DocumentEventMap)[] = [
      'click',
      'mousedown',
      'mouseup',
      'submit',
      'input',
      'change',
      'keydown',
      'keypress',
      'keyup',
    ];
    events.forEach((evt) => document.addEventListener(evt, block, true));
    return () => {
      events.forEach((evt) => document.removeEventListener(evt, block, true));
    };
  }, [email]);

  if (!email) return null;

  const handleEnd = async () => {
    if (ending) return;
    setEnding(true);
    try {
      await fetch('/api/impersonate/end', { method: 'POST' });
      window.location.href = '/login';
    } catch {
      setEnding(false);
    }
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white px-4 py-2.5 flex items-center justify-between gap-3 shadow-md"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
        <p className="text-sm truncate">
          You are viewing as <span className="font-semibold">{email}</span> — read-only mode
        </p>
      </div>
      <button
        onClick={handleEnd}
        disabled={ending}
        data-allow-during-impersonation
        className="inline-flex items-center gap-1.5 text-sm font-medium bg-white/15 hover:bg-white/25 disabled:opacity-60 disabled:cursor-not-allowed rounded-md px-3 py-1.5 transition-colors shrink-0"
      >
        {ending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
        End impersonation
      </button>
    </div>
  );
}
