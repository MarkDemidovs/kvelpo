import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/consent',
  '/privacy',
  '/terms',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/(.*)',
  '/api/stripe/webhook',
]);

const isStaticAsset = (pathname: string) => /\/(_next\/|favicon\.ico|.*\.(?:png|jpg|jpeg|gif|svg|css|js|ico|webmanifest))$/.test(pathname);

export default clerkMiddleware(async (_auth, req) => {
  const pathname = req.nextUrl.pathname;

  if (isPublicRoute(req) || isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  const consentCookie = req.cookies.get('app-consent-granted')?.value === 'true';

  if (!consentCookie) {
    return NextResponse.redirect(new URL('/consent', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};