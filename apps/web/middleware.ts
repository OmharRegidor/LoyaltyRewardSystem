// apps/web/middleware.ts
// Safe middleware with proper error handling and no redirect loops

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// ============================================
// PUBLIC ROUTES CONFIGURATION
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
  '/business/', // Public business pages (for future subdomain feature)
];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  return false;
}

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$/.test(pathname)
  );
}

// ============================================
// MIDDLEWARE
// ============================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // SAFETY: Always allow static assets
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // SAFETY: Always allow public routes without any auth checks
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // For protected routes, check authentication
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

    const { data: { user }, error } = await supabase.auth.getUser();

    // No user or error - redirect to login (but NOT if already going to login)
    if (!user || error) {
      // SAFETY: Prevent redirect loop - never redirect login to login
      if (pathname === '/login' || pathname.startsWith('/login')) {
        return NextResponse.next();
      }
      
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const userId = user.id;

    // Check user roles
    const { data: business } = await supabase
      .from('businesses')
      .select('id, subscription_status')
      .eq('owner_id', userId)
      .maybeSingle();

    const { data: staff } = await supabase
      .from('staff')
      .select('id, role, is_active, business_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    const isOwner = !!business;
    const isStaff = !!staff;

    // ========================================
    // ROUTE PROTECTION
    // ========================================

    // Dashboard routes - owners only
    if (pathname.startsWith('/dashboard')) {
      if (!isOwner) {
        if (isStaff) {
          return NextResponse.redirect(new URL('/staff', request.url));
        }
        return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
      }
      return response;
    }

    // Staff routes - owners and staff
    if (pathname.startsWith('/staff') && pathname !== '/staff/login') {
      if (isOwner || isStaff) {
        return response;
      }
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
    }

    // Default: allow authenticated users
    return response;

  } catch (err) {
    console.error('[Middleware] Error:', err);
    // SAFETY: On error, allow the request through - let the page handle auth
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
