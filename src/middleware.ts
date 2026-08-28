import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Retrieve auth token across possible cookie key names
  const token =
    request.cookies.get('token')?.value ||
    request.cookies.get('user_session')?.value ||
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value;

  const isAuthPage = pathname === '/login' || pathname === '/register';

  // 1. Authenticated User: Prevent access to /login or /register
  if (token) {
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // 2. Unauthenticated User: Allow access to /login or /register
  if (isAuthPage) {
    return NextResponse.next();
  }

  // 3. Unauthenticated User hitting Protected Route: Redirect to /login with return query
  const rawTarget = pathname + search;
  const targetPath = rawTarget.startsWith('/') ? rawTarget : '/dashboard';

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirectTo', targetPath);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/login',
    '/register',
    '/dashboard/:path*',
    '/seller/:path*',
    '/watchlist/:path*',
    '/orders/:path*',
    '/checkout/:path*',
    '/cart/:path*',
    '/admin/:path*',
  ],
};