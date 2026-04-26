// apps/web/lib/impersonation-signer.ts
// Edge-compatible HMAC-SHA256 cookie signer using WebCrypto.
// Works in both Node and Edge middleware runtimes.

import type { ImpersonationMode } from './impersonation-client';

export interface ImpersonationCookiePayload {
  sessionId: string;
  adminUserId: string;
  targetUserId: string;
  targetRole: 'business_owner' | 'staff';
  mode: ImpersonationMode;
}

function getSecretString(): string {
  const explicit = process.env.IMPERSONATION_SECRET;
  if (explicit && explicit.length >= 32) return explicit;
  const fallback = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!fallback) {
    throw new Error('IMPERSONATION_SECRET or SUPABASE_SERVICE_ROLE_KEY must be set');
  }
  return `impersonation:${fallback}`;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(str.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importKey(): Promise<CryptoKey> {
  const rawSecret = new TextEncoder().encode(getSecretString());
  return crypto.subtle.importKey(
    'raw',
    rawSecret as unknown as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

async function sign(message: string): Promise<string> {
  const key = await importKey();
  const data = new TextEncoder().encode(message);
  const sig = await crypto.subtle.sign('HMAC', key, data as unknown as BufferSource);
  return base64UrlEncode(new Uint8Array(sig));
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function encodeImpersonationCookie(payload: ImpersonationCookiePayload): Promise<string> {
  const body = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await sign(body);
  return `${body}.${sig}`;
}

export async function decodeImpersonationCookie(
  raw: string | undefined | null,
): Promise<ImpersonationCookiePayload | null> {
  if (!raw) return null;
  const dot = raw.lastIndexOf('.');
  if (dot <= 0) return null;
  const body = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = await sign(body);
  if (!constantTimeEquals(sig, expected)) return null;
  try {
    const bytes = base64UrlDecode(body);
    const json = new TextDecoder().decode(bytes as unknown as BufferSource);
    const parsed = JSON.parse(json) as ImpersonationCookiePayload;
    if (!parsed.sessionId || !parsed.adminUserId || !parsed.targetUserId) return null;
    // Backward compat: cookies minted before the mode field default to read_only.
    if (parsed.mode !== 'read_only' && parsed.mode !== 'edit') {
      parsed.mode = 'read_only';
    }
    return parsed;
  } catch {
    return null;
  }
}
