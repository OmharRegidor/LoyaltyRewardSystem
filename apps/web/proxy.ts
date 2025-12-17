// apps/web/proxy.ts

import { NextResponse, type NextRequest } from 'next/server';

const publicRoutes = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/auth/callback',
];

// Next.js 16 uses 'proxy' as the export name
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('Proxy hit:', pathname);

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Check auth cookie - log what we find
  const allCookies = request.cookies.getAll();
  const authCookies = allCookies.filter(
    (cookie) => cookie.name.includes('supabase') || cookie.name.includes('auth')
  );

  console.log(
    'Auth cookies found:',
    authCookies.map((c) => c.name)
  );

  const hasAuthCookie = authCookies.length > 0;

  if (!hasAuthCookie) {
    console.log('No auth cookie, redirecting to login');
    return NextResponse.redirect(
      new URL('/login?redirect=' + pathname, request.url)
    );
  }

  console.log('Auth cookie found, allowing through');

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
