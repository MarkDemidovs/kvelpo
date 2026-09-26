import { clerkMiddleware } from '@clerk/nextjs/server';

// Clerk's middleware only attaches auth state here; it doesn't block any route.
// `/`, `/projects`, and `/profile/[id]` support anonymous browsing of public
// content, and per-route auth/ownership checks live in the API routes
// themselves, which is the layer that actually needs to gate access to data.
//
// Cookie consent is NOT enforced by redirecting here: the site only sets
// strictly necessary cookies (auth/session, the consent choice itself), which
// don't require prior consent, and a redirect wall also kept search engines
// from ever reaching the site. EU visitors get the ConsentBanner instead.
export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
