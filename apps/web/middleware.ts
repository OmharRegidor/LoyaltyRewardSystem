// apps/web/middleware.ts

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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
  '/business/',
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

  // Always allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
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

    // Use getUser instead of getSession - more reliable
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // Handle auth errors gracefully
    if (error) {
      console.log('[Middleware] Auth error:', error.message);

      // Clear invalid cookies and redirect to login
      const loginUrl = new URL('/login', request.url);
      const redirectResponse = NextResponse.redirect(loginUrl);

      // Clear all Supabase cookies
      request.cookies.getAll().forEach((cookie) => {
        if (cookie.name.startsWith('sb-')) {
          redirectResponse.cookies.delete(cookie.name);
        }
      });

      return redirectResponse;
    }

    // No user - redirect to login
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // User authenticated - check permissions
    const userId = user.id;

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

    const { data: staff } = await supabase
      .from('staff')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    const isOwner = !!business;
    const isStaff = !!staff;

    // Dashboard routes - owners only
    if (pathname.startsWith('/dashboard')) {
      if (!isOwner) {
        if (isStaff) {
          return NextResponse.redirect(new URL('/staff', request.url));
        }
        return NextResponse.redirect(
          new URL('/login?error=unauthorized', request.url),
        );
      }
      return response;
    }

    // Staff routes
    if (pathname.startsWith('/staff') && pathname !== '/staff/login') {
      if (isOwner || isStaff) {
        return response;
      }
      return NextResponse.redirect(
        new URL('/login?error=unauthorized', request.url),
      );
    }

    return response;
  } catch (err) {
    console.error('[Middleware] Unexpected error:', err);
    // On unexpected error, allow through - let page handle it
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
