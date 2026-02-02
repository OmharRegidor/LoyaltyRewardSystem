// apps/web/middleware.ts

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// ============================================
// SUBDOMAIN ROUTING CONFIGURATION
// ============================================

const MAIN_DOMAINS = [
  'noxaloyalty.com',
  'www.noxaloyalty.com',
  'localhost:3000',
  'localhost',
];

const RESERVED_SUBDOMAINS = [
  'www',
  'api',
  'app',
  'dashboard',
  'admin',
  'mail',
  'email',
  'support',
  'help',
  'docs',
  'blog',
  'staging',
  'dev',
  'test',
];

/**
 * Extract subdomain from hostname
 * Returns null if no subdomain or if it's a reserved subdomain
 */
function getSubdomain(hostname: string): string | null {
  // Skip Vercel preview deployments
  if (hostname.endsWith('.vercel.app')) {
    return null;
  }

  // Skip main domains
  if (MAIN_DOMAINS.some((d) => hostname === d)) {
    return null;
  }

  const parts = hostname.split('.');

  // Local development: binukbok.localhost:3000
  if (hostname.includes('localhost')) {
    const subdomain = parts[0];
    if (subdomain === 'localhost') return null;
    return RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())
      ? null
      : subdomain;
  }

  // Production: binukbok.noxaloyalty.com (3+ parts)
  if (parts.length >= 3) {
    const subdomain = parts[0];
    return RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())
      ? null
      : subdomain;
  }

  return null;
}

// ============================================
// PUBLIC ROUTES CONFIGURATION
// ============================================

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/auth/callback',
  '/staff/login', // Will redirect to /login anyway
  '/terms',
  '/privacy',
  '/book-call',
];

const PUBLIC_PREFIXES = [
  '/invite/',
  '/checkout/',
  '/card/',
  '/api/',
  '/qr/',
  '/business/', // Public business storefront pages
];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)))
    return true;
  return false;
}

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // ============================================
  // SUBDOMAIN ROUTING (check first)
  // ============================================

  const subdomain = getSubdomain(hostname);

  if (subdomain) {
    // Rewrite to /business/[slug]/... path
    const url = request.nextUrl.clone();
    url.pathname = `/business/${subdomain}${pathname === '/' ? '' : pathname}`;
    return NextResponse.rewrite(url);
  }

  // Allow static assets and public routes
  if (isStaticAsset(pathname) || isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
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

    // No user - redirect to login
    if (!user || error) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const userId = user.id;

    // Check if user is business owner
    const { data: business } = await supabase
      .from('businesses')
      .select('id, subscription_status')
      .eq('owner_id', userId)
      .maybeSingle();

    // Check if user is staff
    const { data: staff } = await supabase
      .from('staff')
      .select('id, role, is_active, business_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    const isOwner = !!business;
    const isStaff = !!staff;

    // ========================================
    // ROUTE PROTECTION LOGIC
    // ========================================

    // Accessing /dashboard/* routes
    if (pathname.startsWith('/dashboard')) {
      if (!isOwner) {
        if (isStaff) {
          // Staff trying to access dashboard - redirect to staff page
          return NextResponse.redirect(new URL('/staff', request.url));
        }
        // Neither owner nor staff
        return NextResponse.redirect(
          new URL('/login?error=unauthorized', request.url),
        );
      }
      // Owner - allow access
      return response;
    }

    // Accessing /staff/* routes (except /staff/login)
    if (pathname.startsWith('/staff') && pathname !== '/staff/login') {
      // Business owner can access staff page (for their own business)
      if (isOwner) {
        return response;
      }

      // Staff can access their assigned business's staff page
      if (isStaff) {
        return response;
      }

      // Not authorized
      return NextResponse.redirect(
        new URL('/login?error=unauthorized', request.url),
      );
    }

    // Default: allow if authenticated
    return response;
  } catch (err) {
    console.error('Middleware error:', err);
    // On error, allow request but let page handle auth
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
