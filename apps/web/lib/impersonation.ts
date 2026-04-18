// apps/web/lib/impersonation.ts
// Server-only helpers for impersonation: cookie setting, opaque token generation, hashing.
// Cookie signing/verification lives in ./impersonation-signer so it is edge-compatible.

import crypto from 'crypto';
import { cookies } from 'next/headers';
import {
  IMPERSONATION_COOKIE_NAME,
  IMPERSONATION_DISPLAY_COOKIE_NAME,
} from './impersonation-client';
import {
  encodeImpersonationCookie,
  type ImpersonationCookiePayload,
} from './impersonation-signer';

export type { ImpersonationCookiePayload } from './impersonation-signer';
export {
  encodeImpersonationCookie,
  decodeImpersonationCookie,
} from './impersonation-signer';
export {
  IMPERSONATION_COOKIE_NAME,
  IMPERSONATION_DISPLAY_COOKIE_NAME,
};

export function generateOpaqueToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}

export function hashOpaqueToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function setImpersonationCookies(
  payload: ImpersonationCookiePayload,
  displayEmail: string,
): Promise<void> {
  const store = await cookies();
  const secure = process.env.NODE_ENV === 'production';
  const encoded = await encodeImpersonationCookie(payload);
  store.set(IMPERSONATION_COOKIE_NAME, encoded, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
  });
  store.set(IMPERSONATION_DISPLAY_COOKIE_NAME, displayEmail, {
    httpOnly: false,
    sameSite: 'lax',
    secure,
    path: '/',
  });
}

export async function clearImpersonationCookies(): Promise<void> {
  const store = await cookies();
  store.delete(IMPERSONATION_COOKIE_NAME);
  store.delete(IMPERSONATION_DISPLAY_COOKIE_NAME);
}
