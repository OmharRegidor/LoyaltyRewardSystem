// apps/web/middleware.ts

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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

const PUBLIC_PREFIXES = ['/invite/', '/checkout/', '/card/', '/api/', '/qr/'];

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
