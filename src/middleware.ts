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

// Auth is intentionally NOT enforced here: `/`, `/projects`, and `/profile/[id]`
// all support anonymous browsing of public content (see their client-side
// isSignedIn checks). Per-route auth/ownership checks live in the API routes
// themselves, which is the layer that actually needs to gate access to data.
export default clerkMiddleware(async (_auth, req) => {
  const pathname = req.nextUrl.pathname;

  if (isPublicRoute(req) || isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  const consentStatus = req.cookies.get('app-consent-status')?.value;
  const hasConsentDecision = consentStatus === 'accepted' || consentStatus === 'rejected';

  if (!hasConsentDecision) {
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