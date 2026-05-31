import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/login(.*)", "/api/webhook(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();

  // Authenticated users hitting /login → bounce to dashboard.
  // Exception: when /login is showing the "not authorised" error, let it
  // render so the user can see the message and sign out — otherwise the
  // dashboard layout redirects them back here and we loop.
  if (
    userId &&
    request.nextUrl.pathname.startsWith("/login") &&
    request.nextUrl.searchParams.get("error") !== "not_authorised"
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Unauthenticated users hitting protected routes → bounce to /login
  if (!userId && !isPublicRoute(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
});

export const config = {
  matcher: [
    // Skip Next internals and all static files unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
