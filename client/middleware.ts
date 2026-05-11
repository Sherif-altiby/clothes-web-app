import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['en', 'ar'];
const defaultLocale = 'en';

function getLocale(request: NextRequest): string {
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage && acceptLanguage.toLowerCase().includes('ar')) {
    return 'ar';
  }
  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    const isRootLocale = locales.some(
      (locale) => pathname === `/${locale}` || pathname === `/${locale}/`
    );
    if (isRootLocale) {
      const locale = pathname.replace('/', '');
      request.nextUrl.pathname = `/${locale}/user`;
      return NextResponse.redirect(request.nextUrl);
    }
    return;
  }

  // Redirect if there is no locale
  const locale = getLocale(request);

  if (pathname === '/') {
    request.nextUrl.pathname = `/${locale}/user`;
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
