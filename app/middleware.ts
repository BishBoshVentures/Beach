import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/login(.*)", "/api/webhook(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();

  // Authenticated users hitting /login → bounce to dashboard
  if (userId && request.nextUrl.pathname.startsWith("/login")) {
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
