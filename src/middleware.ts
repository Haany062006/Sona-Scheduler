import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Static assets and internal next paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/samples') ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next();
  }

  // 2. Public web pages (no admin login required)
  const isPublicPage =
    pathname === '/login' ||
    pathname.startsWith('/attendance/');

  // 3. Public API endpoints
  const isPublicApi =
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/logout' ||
    pathname === '/api/auth/reset-password' ||
    pathname.startsWith('/api/attendance/');

  const sessionCookie = request.cookies.get('sona_admin_session');

  // Check valid session format
  let isAuthenticated = false;
  if (sessionCookie?.value) {
    try {
      const parsed = JSON.parse(sessionCookie.value);
      if (parsed && parsed.expires && parsed.expires > Date.now()) {
        isAuthenticated = true;
      }
    } catch {
      isAuthenticated = false;
    }
  }

  // 4. API Route Protection: All other /api/* routes require an active admin session
  if (pathname.startsWith('/api/')) {
    if (isPublicApi) {
      return NextResponse.next();
    }

    if (!isAuthenticated) {
      return NextResponse.json(
        {
          error: 'Unauthorized. Administrative credentials or active session required to access this endpoint.',
          status: 401,
        },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  // 5. If user is accessing login page while already authenticated, redirect to dashboard
  if (pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 6. Root path redirect
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 7. Protect all internal admin web pages
  if (!isPublicPage && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/regulations/upload-syllabus|api/arrears/upload-pdf).*)'],
};
