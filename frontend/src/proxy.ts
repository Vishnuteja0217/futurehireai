// Clerk middleware — required so auth() works in API routes and pages.
// This runs on every request, lets Clerk attach session info, and applies
// to all routes by default. We're not protecting anything here yet
// (that's done at the component level via <Show> and useUser()).

import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Run middleware on all paths EXCEPT Next.js internals + static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes (this is the important one for our fix)
    "/(api|trpc)(.*)",
  ],
};