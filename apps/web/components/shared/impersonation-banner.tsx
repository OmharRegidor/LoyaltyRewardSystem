'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, LogOut, Loader2 } from 'lucide-react';
import {
  IMPERSONATION_DISPLAY_COOKIE_NAME,
  IMPERSONATION_MODE_COOKIE_NAME,
  type ImpersonationMode,
} from '@/lib/impersonation-client';

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

function readMode(): ImpersonationMode {
  const raw = readCookie(IMPERSONATION_MODE_COOKIE_NAME);
  return raw === 'edit' ? 'edit' : 'read_only';
}

export function ImpersonationBanner() {
  const [email, setEmail] = useState<string | null>(null);
  const [mode, setMode] = useState<ImpersonationMode>('read_only');
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    const check = () => {
      setEmail(readCookie(IMPERSONATION_DISPLAY_COOKIE_NAME));
      setMode(readMode());
    };
    check();
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, []);

  // Toggle body attributes so global CSS can scope dimming to read-only only.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (email) {
      document.body.setAttribute('data-impersonation', 'true');
      document.body.setAttribute('data-impersonation-mode', mode);
      document.body.style.paddingTop = '52px';
    } else {
      document.body.removeAttribute('data-impersonation');
      document.body.removeAttribute('data-impersonation-mode');
      document.body.style.paddingTop = '';
    }
    return () => {
      document.body.removeAttribute('data-impersonation');
      document.body.removeAttribute('data-impersonation-mode');
      document.body.style.paddingTop = '';
    };
  }, [email, mode]);

  // Capture-phase interceptor: only installed in read-only mode. In edit mode
  // writes flow to their handlers normally.
  useEffect(() => {
    if (typeof document === 'undefined' || !email || mode !== 'read_only') return;

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
  }, [email, mode]);

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

  const bannerClass =
    mode === 'edit'
      ? 'bg-amber-600 text-white'
      : 'bg-red-600 text-white';
  const message =
    mode === 'edit'
      ? `Editing as ${email} — changes are saved as this user`
      : `You are viewing as ${email} — read-only mode`;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] px-4 py-2.5 flex items-center justify-between gap-3 shadow-md ${bannerClass}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
        <p className="text-sm truncate">{message}</p>
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
