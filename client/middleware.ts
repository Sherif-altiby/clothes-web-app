import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['en', 'ar'];
const defaultLocale = 'en';
type UserRole = 'USER' | 'ADMIN';

function getTokenRole(token: string | undefined): UserRole | null {
  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))) as {
      role?: unknown;
      exp?: unknown;
    };

    if (
      (decoded.role !== 'USER' && decoded.role !== 'ADMIN') ||
      typeof decoded.exp !== 'number' ||
      decoded.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return decoded.role;
  } catch {
    return null;
  }
}

function getRoleHome(locale: string, role: UserRole | null) {
  return role === 'ADMIN' ? `/${locale}/admin` : `/${locale}/user`;
}

function getLocale(request: NextRequest): string {
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage && acceptLanguage.toLowerCase().includes('ar')) {
    return 'ar';
  }
  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = getTokenRole(request.cookies.get('accessToken')?.value);

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    const isRootLocale = locales.some(
      (locale) => pathname === `/${locale}` || pathname === `/${locale}/`
    );
    if (isRootLocale) {
      const locale = pathname.replace('/', '');
      request.nextUrl.pathname = getRoleHome(locale, role);
      return NextResponse.redirect(request.nextUrl);
    }

    const locale = pathname.split('/')[1];
    const isLoginPage = pathname === `/${locale}/login`;
    if (isLoginPage && role) {
      request.nextUrl.pathname = getRoleHome(locale, role);
      return NextResponse.redirect(request.nextUrl);
    }

    const isAdminRoute =
      pathname === `/${locale}/admin` || pathname.startsWith(`/${locale}/admin/`);
    if (isAdminRoute && role !== 'ADMIN') {
      if (role === 'USER') {
        request.nextUrl.pathname = `/${locale}/user`;
        request.nextUrl.search = '';
      } else {
        const returnTo = `${pathname}${request.nextUrl.search}`;
        request.nextUrl.pathname = `/${locale}/login`;
        request.nextUrl.search = `?returnTo=${encodeURIComponent(returnTo)}`;
      }
      return NextResponse.redirect(request.nextUrl);
    }

    return;
  }

  // Redirect if there is no locale
  const locale = getLocale(request);

  if (pathname === '/') {
    request.nextUrl.pathname = getRoleHome(locale, role);
  } else {
    request.nextUrl.pathname = `/${locale}${pathname}`;
  }

  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, public files, images, api, etc.)
    '/((?!_next|favicon.ico|api|.*\\.).*)',
  ],
};
