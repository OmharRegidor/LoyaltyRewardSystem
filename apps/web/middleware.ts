// apps/web/middleware.ts

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { IMPERSONATION_COOKIE_NAME } from '@/lib/impersonation-client';
import { decodeImpersonationCookie } from '@/lib/impersonation-signer';

const IMPERSONATION_ALLOWED_WRITE_PATHS = [
  '/api/impersonate/end',
];

function isImpersonationAllowedWrite(pathname: string): boolean {
  return IMPERSONATION_ALLOWED_WRITE_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

const EDIT_MODE_BLOCKED_WRITE_PATHS = [
  '/api/billing/',
  '/api/admin/',
  '/api/manual-invoices/',
];

function isEditModeBlocked(pathname: string): boolean {
  return EDIT_MODE_BLOCKED_WRITE_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p),
  );
}

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/auth/callback',
  '/auth/impersonate',
  '/terms',
  '/privacy',
  '/book-call',
  '/business',
  '/access-denied',
  '/staff/create-account',
  '/download',
  '/delete-account',
];

const PUBLIC_PREFIXES = [
  '/invite/',
  '/api/public/',
  '/api/webhooks/',
  '/api/qr/',
  '/api/auth/',
  '/api/account/',
  '/api/download/',
  '/qr/',
  '/business/',
  '/join/',
];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)))
    return true;
  return false;
}

// Redis rate limiters (initialized lazily, no-op if env vars missing)
const rateLimiters = new Map<string, Ratelimit>();

function getRateLimiter(prefix: string, tokens: number, window: string): Ratelimit | null {
  if (rateLimiters.has(prefix)) return rateLimiters.get(prefix)!;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(tokens, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    prefix: `rl:${prefix}`,
  });
  rateLimiters.set(prefix, limiter);
  return limiter;
}

// Sensitive endpoints get tighter limits (tokens per window)
const ENDPOINT_LIMITS: Record<string, { tokens: number; window: string }> = {
  '/api/auth/':     { tokens: 10, window: '60 s' },   // login/check-email: 10/min
  '/api/billing/':  { tokens: 30, window: '60 s' },   // billing ops: 30/min
  '/api/staff/pos/': { tokens: 30, window: '60 s' },  // POS sales: 30/min
  '/api/public/':   { tokens: 30, window: '60 s' },   // public endpoints: 30/min
  '/api/admin/impersonate': { tokens: 10, window: '600 s' }, // impersonation: 10 per 10 min
  '/api/admin/':    { tokens: 60, window: '60 s' },   // general admin: 60/min
};

function getEndpointLimiter(pathname: string): Ratelimit | null {
  for (const [prefix, config] of Object.entries(ENDPOINT_LIMITS)) {
    if (pathname.startsWith(prefix)) {
      return getRateLimiter(prefix, config.tokens, config.window);
    }
  }
  // Default global API limiter
  return getRateLimiter('mw', 100, '60 s');
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    'unknown'
  );
}

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$/.test(
      pathname,
    )
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow static assets
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // Impersonation: enforce mode-aware write rules.
  const impersonationPayload = await decodeImpersonationCookie(
    request.cookies.get(IMPERSONATION_COOKIE_NAME)?.value,
  );

  if (impersonationPayload) {
    const method = request.method.toUpperCase();
    const isWrite = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
    if (isWrite) {
      const alwaysAllowed = isImpersonationAllowedWrite(pathname);
      if (!alwaysAllowed) {
        if (impersonationPayload.mode === 'read_only') {
          return new NextResponse(
            JSON.stringify({ error: 'Read-only during impersonation' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } },
          );
        }
        if (impersonationPayload.mode === 'edit' && isEditModeBlocked(pathname)) {
          return new NextResponse(
            JSON.stringify({ error: 'Blocked: billing and plan endpoints are off-limits during impersonation edit mode' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } },
          );
        }
      }
    }
  }

  // Rate limit API routes, then let them through (they handle their own auth)
  if (pathname.startsWith('/api/')) {
    const limiter = getEndpointLimiter(pathname);
    if (limiter) {
      const ip = getClientIp(request);
      const result = await limiter.limit(ip);
      if (!result.success) {
        return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((result.reset - Date.now()) / 1000)),
          },
        });
      }
    }
    // API routes handle their own auth via Bearer tokens — don't apply cookie-based auth
    return NextResponse.next();
  }

  // Admin subdomain detection
  const hostname = request.headers.get('host') || '';
  const isAdminSubdomain = hostname.startsWith('admin.');

  // If on admin subdomain, rewrite non-public paths to /admin/* internally
  if (isAdminSubdomain && !pathname.startsWith('/admin')) {
    // Let public routes through normally (e.g. /login, /auth/callback) except `/`
    if (isPublicRoute(pathname) && pathname !== '/') {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname === '/' ? '' : pathname}`;
    return NextResponse.rewrite(url);
  }

  // Intercept Supabase auth errors on root URL (e.g. expired password reset links)
  // Supabase redirects to Site URL with error params when OTP verification fails
  if (pathname === '/') {
    const errorCode = request.nextUrl.searchParams.get('error_code');
    if (errorCode) {
      const loginUrl = new URL('/login', request.url);
      if (errorCode === 'otp_expired') {
        loginUrl.searchParams.set('error', 'link_expired');
      } else {
        const errorDesc = request.nextUrl.searchParams.get('error_description');
        loginUrl.searchParams.set('error', errorDesc || 'auth_error');
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  // Always allow public routes on non-admin subdomains
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Block /admin routes on non-admin subdomains
  if (pathname.startsWith('/admin') && !isAdminSubdomain) {
    return NextResponse.redirect(new URL('/access-denied', request.url));
  }

  // For protected routes, check auth
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // Handle auth errors
    if (error) {
      console.log('[Middleware] Auth error:', error.message);

      // Only redirect on actual auth failures, not transient network errors
      const isTransientError =
        error.message === 'fetch failed' ||
        error.message.includes('network') ||
        error.message.includes('ECONNREFUSED');

      if (isTransientError) {
        // Let the page load — client-side auth will handle retry
        return response;
      }

      // Real auth failure — clean up cookies and redirect
      request.cookies.getAll().forEach((cookie) => {
        if (cookie.name.startsWith('sb-')) {
          response.cookies.delete(cookie.name);
        }
      });
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // No user — redirect to login
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role enforcement for admin routes is handled by the page-level
    // ServerRestricted layout guard (which uses the cached getCurrentUser
    // from server-auth.ts). The middleware only needs to ensure the user
    // is authenticated — removing the duplicate DB query saves a round-trip
    // on every admin page navigation.
    return response;
  } catch (err) {
    console.error('[Middleware] Unexpected error:', err);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
