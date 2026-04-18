// apps/web/lib/supabase.ts

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../../../packages/shared/types/database';
import { IMPERSONATION_DISPLAY_COOKIE_NAME } from './impersonation-client';

// Writes are blocked at two layers during impersonation:
//   1. Next.js middleware blocks any POST/PUT/PATCH/DELETE to our own routes.
//   2. This wrapper intercepts direct client-side Supabase mutations
//      (.update/.insert/.delete/.upsert/.rpc) that would otherwise bypass (1)
//      by going straight to the Supabase REST endpoint.
const BLOCKED_METHODS = new Set(['update', 'insert', 'delete', 'upsert']);

function isImpersonating(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie
    .split('; ')
    .some((c) => c.startsWith(`${IMPERSONATION_DISPLAY_COOKIE_NAME}=`));
}

function blockedBuilder(method: string): unknown {
  const error = {
    message: `Blocked: cannot ${method} during impersonation (read-only mode).`,
    code: 'impersonation_read_only',
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rejection: any = Promise.resolve({ data: null, error });
  rejection.then = rejection.then.bind(rejection);
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        return rejection[prop as keyof typeof rejection];
      }
      // chainable filter/select methods stay on the same rejected builder
      return () => new Proxy({}, handler);
    },
  };
  return new Proxy({}, handler);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function wrapFromBuilder(builder: any) {
  return new Proxy(builder, {
    get(target, prop, receiver) {
      if (typeof prop === 'string' && BLOCKED_METHODS.has(prop) && isImpersonating()) {
        return () => blockedBuilder(prop);
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
  (raw as any).from = (table: string) => wrapFromBuilder(originalFrom(table as never));

  // Block storage mutations (uploads, deletes) during impersonation.
  const STORAGE_BLOCKED = new Set(['upload', 'update', 'remove', 'move', 'copy', 'createSignedUploadUrl']);
  const originalStorageFrom = raw.storage.from.bind(raw.storage);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (raw.storage as any).from = (bucket: string) => {
    const bucketApi = originalStorageFrom(bucket);
    return new Proxy(bucketApi, {
      get(target, prop, receiver) {
        if (typeof prop === 'string' && STORAGE_BLOCKED.has(prop) && isImpersonating()) {
          return () => Promise.resolve({
            data: null,
            error: {
              message: `Blocked: cannot ${prop} during impersonation (read-only mode).`,
              code: 'impersonation_read_only',
            },
          });
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
