import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Checks for JWT cookie ('token') or user session cookie ('user_session')
  const token =
    request.cookies.get('token')?.value ||
    request.cookies.get('user_session')?.value;

  if (token) {
    return NextResponse.next();
  }

  // Redirect to /login with target route using 'redirectTo'
  const targetPath = request.nextUrl.pathname + request.nextUrl.search;
  const loginUrl = new URL('/login', request.url);
  
  // Sets both parameters so any login page logic works consistently
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