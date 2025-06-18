import { auth } from "@/server/auth";
import {
  DEFAULT_LOGIN_REDIRECT_URL,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "@/server/routes";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  // Allow everyone to access API auth routes "/api/auth/*"
  if (isApiAuthRoute) {
    return;
  }

  // Handle auth routes "/signin", "/signup", "/forgot-password", "/reset-password"
  // If user is logged in, redirect to dashboard, otherwise allow access
  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT_URL, nextUrl));
    }
    return;
  }

  // Handle protected routes
  // If user is not logged in and trying to access protected routes, redirect to signin
  if (!isLoggedIn && !isPublicRoute) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }

    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    const signInUrl = `/signin?callbackUrl=${encodedCallbackUrl}`;
    
    return Response.redirect(new URL(signInUrl, nextUrl));
  }

  return;
});

/**
 * Auth.js v5 matcher configuration
 * Optimized for Next.js 15 compatibility
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except static files and Next.js internals
     * More specific pattern for Auth.js v5
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
    "/",
    "/(api|trpc)(.*)"
  ],
}; 