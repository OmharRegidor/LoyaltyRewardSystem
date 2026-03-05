// apps/web/middleware.ts

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/auth/callback',
  '/terms',
  '/privacy',
  '/book-call',
  '/business',
  '/access-denied',
  '/staff/create-account',
  '/download',
];

const PUBLIC_PREFIXES = [
  '/invite/',
  '/checkout/',
  '/card/',
  '/api/public/',
  '/api/webhooks/',
  '/api/qr/',
  '/api/auth/',
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
  '/api/billing/':  { tokens: 10, window: '60 s' },   // billing ops: 10/min
  '/api/staff/pos/': { tokens: 30, window: '60 s' },  // POS sales: 30/min
  '/api/public/':   { tokens: 30, window: '60 s' },   // public endpoints: 30/min
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

    // Handle auth errors — clean up bad cookies and redirect to login
    if (error) {
      console.log('[Middleware] Auth error:', error.message);
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

    // User is authenticated — role checks are handled by layout-level components
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
