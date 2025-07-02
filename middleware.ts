import { authMiddleware } from "@clerk/nextjs"

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your Middleware
export default authMiddleware({
  publicRoutes: [
    "/",
    "/api/quotes(.*)",
    "/api/services(.*)",
    "/api/settings(.*)",
    "/api/calculate-distance",
    "/api/get-square-footage",
    "/api/send-email",
    "/api/send-email-simple",
    "/api/submit-commercial-inquiry",
    "/api/send-outside-area-inquiry",
    "/api/track-calculator-start",
    "/api/test-connection",
    "/api/webhooks(.*)",
  ],
})

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
