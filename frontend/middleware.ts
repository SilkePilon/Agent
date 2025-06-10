import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/api/(.*)", // Protect all API routes
    // Add other routes you want to protect
  ],
};
