import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  if (request.cookies.has('user_session')) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
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
