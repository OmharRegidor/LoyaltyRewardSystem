// apps/web/lib/supabase.ts

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../../../packages/shared/types/database';
import {
  IMPERSONATION_DISPLAY_COOKIE_NAME,
  IMPERSONATION_MODE_COOKIE_NAME,
  type ImpersonationMode,
} from './impersonation-client';

// Writes are blocked at multiple layers during impersonation:
//   1. Next.js middleware blocks POST/PUT/PATCH/DELETE on our own routes.
//   2. This wrapper intercepts direct client-side Supabase mutations
//      (.update/.insert/.delete/.upsert) that would otherwise bypass (1)
//      by going straight to the Supabase REST endpoint.
//
// In read-only mode every mutation is blocked. In edit mode, writes pass
// through EXCEPT writes to billing tables, and `businesses.update()` payloads
// that attempt to change plan / module flags.

const BLOCKED_METHODS = new Set(['update', 'insert', 'delete', 'upsert']);
const EDIT_MODE_BLOCKED_TABLES = new Set([
  'manual_invoices',
  'manual_invoice_payments',
]);
const BUSINESSES_PROTECTED_COLUMNS = new Set(['plan', 'has_loyalty', 'has_pos']);

interface ImpersonationState {
  active: boolean;
  mode: ImpersonationMode;
}

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

function getImpersonationState(): ImpersonationState {
  const active = readCookie(IMPERSONATION_DISPLAY_COOKIE_NAME) !== null;
  if (!active) return { active: false, mode: 'read_only' };
  const modeRaw = readCookie(IMPERSONATION_MODE_COOKIE_NAME);
  const mode: ImpersonationMode = modeRaw === 'edit' ? 'edit' : 'read_only';
  return { active: true, mode };
}

function blockedBuilder(method: string, reason: string): unknown {
  const error = {
    message: `Blocked: cannot ${method} during impersonation (${reason}).`,
    code: 'impersonation_blocked',
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rejection: any = Promise.resolve({ data: null, error });
  rejection.then = rejection.then.bind(rejection);
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        return rejection[prop as keyof typeof rejection];
      }
      return () => new Proxy({}, handler);
    },
  };
  return new Proxy({}, handler);
}

function wrapFromBuilder(builder: unknown, table: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Proxy(builder as any, {
    get(target, prop, receiver) {
      if (typeof prop !== 'string' || !BLOCKED_METHODS.has(prop)) {
        const value = Reflect.get(target, prop, receiver);
        return typeof value === 'function' ? value.bind(target) : value;
      }
      const state = getImpersonationState();
      if (!state.active) {
        const value = Reflect.get(target, prop, receiver);
        return typeof value === 'function' ? value.bind(target) : value;
      }
      if (state.mode === 'read_only') {
        return () => blockedBuilder(prop, 'read-only mode');
      }
      // state.mode === 'edit'
      if (EDIT_MODE_BLOCKED_TABLES.has(table)) {
        return () => blockedBuilder(prop, 'billing tables are off-limits in edit mode');
      }
      if (table === 'businesses' && (prop === 'update' || prop === 'upsert')) {
        type BusinessesPayload = Record<string, unknown> | Record<string, unknown>[];
        const original = Reflect.get(target, prop, receiver) as (_payload: BusinessesPayload) => unknown;
        return (payload: BusinessesPayload) => {
          const rows = Array.isArray(payload) ? payload : [payload];
          const touchesProtected = rows.some(
            (row) =>
              row != null &&
              typeof row === 'object' &&
              Object.keys(row).some((k) => BUSINESSES_PROTECTED_COLUMNS.has(k)),
          );
          if (touchesProtected) {
            return blockedBuilder(prop, 'plan/module flags are off-limits in edit mode');
          }
          return original.call(target, payload);
        };
      }
      const value = Reflect.get(target, prop, receiver);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

// ============================================
// BROWSER CLIENT (for client components)
// ============================================
export function createClient() {
  const raw = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const originalFrom = raw.from.bind(raw);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (raw as any).from = (table: string) =>
    wrapFromBuilder(originalFrom(table as never), table);

  // Block storage mutations in read-only only. In edit mode, logo uploads on
  // behalf of the owner are a valid use case.
  const STORAGE_BLOCKED = new Set(['upload', 'update', 'remove', 'move', 'copy', 'createSignedUploadUrl']);
  const originalStorageFrom = raw.storage.from.bind(raw.storage);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (raw.storage as any).from = (bucket: string) => {
    const bucketApi = originalStorageFrom(bucket);
    return new Proxy(bucketApi, {
      get(target, prop, receiver) {
        if (typeof prop === 'string' && STORAGE_BLOCKED.has(prop)) {
          const state = getImpersonationState();
          if (state.active && state.mode === 'read_only') {
            return () =>
              Promise.resolve({
                data: null,
                error: {
                  message: `Blocked: cannot ${prop} during impersonation (read-only mode).`,
                  code: 'impersonation_read_only',
                },
              });
          }
        }
        const value = Reflect.get(target, prop, receiver);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
  };

  return raw;
}

// Type exports
export type SupabaseClient = ReturnType<typeof createClient>;
export type { Database };
