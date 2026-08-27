import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Retrieve auth token (supports NextAuth JWT tokens, standard tokens, or custom session cookies)
  const token =
    request.cookies.get('token')?.value ||
    request.cookies.get('user_session')?.value ||
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value;

  // If authenticated, allow request to proceed
  if (token) {
    // If authenticated user tries to access /login or /register, redirect to dashboard
    if (pathname === '/login' || pathname === '/register') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Prevent infinite redirect if already on login page
  if (pathname === '/login') {
    return NextResponse.next();
  }

  // Sanitize target destination URL to protect against open-redirect vulnerability
  const rawTarget = pathname + search;
  const targetPath = rawTarget.startsWith('/') ? rawTarget : '/dashboard';

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirectTo', targetPath);
  loginUrl.searchParams.set('next', targetPath);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/seller/:path*',
    '/watchlist/:path*',
    '/orders/:path*',
    '/checkout/:path*',
    '/cart/:path*',
    '/admin/:path*',
  ],
};