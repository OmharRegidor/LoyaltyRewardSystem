// apps/web/proxy.ts

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// ============================================
// ROUTE CONFIGURATION
// ============================================

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/auth/callback',
  '/staff/login',
];

// Routes that start with these prefixes are public
const PUBLIC_PREFIXES = [
  '/invite/', // /invite/[token] is public
  '/checkout/', // /checkout/[planId] is public (signup flow)
];

// Owner-only routes
const OWNER_ROUTES = ['/dashboard'];

// Staff/Cashier routes (owner can also access)
const STAFF_ROUTES = ['/staff'];

// ============================================
// HELPER FUNCTIONS
// ============================================

function isPublicRoute(pathname: string): boolean {
  // Exact match
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true;
  }

  // Prefix match
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  return false;
}

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  );
}

// ============================================
// MAIN PROXY FUNCTION
// ============================================

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Create response to modify cookies if needed
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client for server
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

  // Get user - this validates the session properly
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // No user = redirect to login
  if (!user || userError) {
    // Don't redirect if coming from auth callback (give cookies time to set)
    const referer = request.headers.get('referer') || '';
    const isFromAuthCallback = referer.includes('/auth/callback');

    // Also check if this is immediately after auth (within 5 seconds)
    const authTimestamp = request.cookies.get('auth_timestamp')?.value;
    const isRecentAuth =
      authTimestamp && Date.now() - parseInt(authTimestamp) < 5000;

    if (isFromAuthCallback || isRecentAuth) {
      // Allow the request to proceed - give cookies time to propagate
      return response;
    }

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // User exists - now check role-based access
  const userId = user.id;

  // Check if user is a business owner
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();

  const isOwner = !!business;

  // Check if user is staff
  const { data: staff } = await supabase
    .from('staff')
    .select('id, role, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  const isStaff = !!staff;

  // ============================================
  // ROUTE PROTECTION LOGIC
  // ============================================

  // Accessing /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!isOwner) {
      // Not an owner - redirect based on role
      if (isStaff) {
        return NextResponse.redirect(new URL('/staff', request.url));
      }
      // Not owner, not staff - redirect to login
      return NextResponse.redirect(
        new URL('/login?error=unauthorized', request.url),
      );
    }
    // Owner - allow access
    return response;
  }

  // Accessing /staff routes
  if (pathname.startsWith('/staff') && pathname !== '/staff/login') {
    // Owners can access staff routes
    if (isOwner) {
      return response;
    }

    // Staff can access
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
}

// ============================================
// MATCHER CONFIGURATION
// ============================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
