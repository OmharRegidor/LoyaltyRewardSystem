// apps/web/middleware.ts

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { type AppRole, getAllowedRolesForPath } from './lib/rbac';

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
  '/access-denied',
];

const PUBLIC_PREFIXES = [
  '/invite/',
  '/checkout/',
  '/card/',
  '/api/',
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

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // Handle auth errors gracefully
    if (error) {
      console.log('[Middleware] Auth error:', error.message);

      // Only redirect to login for routes that explicitly require auth
      const allowedRoles = getAllowedRolesForPath(pathname);
      if (allowedRoles) {
        const loginUrl = new URL('/login', request.url);
        const redirectResponse = NextResponse.redirect(loginUrl);
        request.cookies.getAll().forEach((cookie) => {
          if (cookie.name.startsWith('sb-')) {
            redirectResponse.cookies.delete(cookie.name);
          }
        });
        return redirectResponse;
      }

      // For other routes, clean up bad cookies but let the request through
      request.cookies.getAll().forEach((cookie) => {
        if (cookie.name.startsWith('sb-')) {
          response.cookies.delete(cookie.name);
        }
      });
      return response;
    }

    // No user — only redirect to login for routes that explicitly require auth
    if (!user) {
      const allowedRoles = getAllowedRolesForPath(pathname);
      if (allowedRoles) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
      return response;
    }

    // Fetch user role from public.users joined with roles
    const { data: profile } = await supabase
      .from('users')
      .select('role_id, roles(name)')
      .eq('id', user.id)
      .single();

    const userRole: AppRole =
      (profile?.roles as unknown as { name: AppRole } | null)?.name ?? 'customer';

    // Check route permissions
    const allowedRoles = getAllowedRolesForPath(pathname);

    if (allowedRoles && !allowedRoles.includes(userRole)) {
      return NextResponse.redirect(new URL('/access-denied', request.url));
    }

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
