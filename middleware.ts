import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Only add CORS headers for API routes
  if (path.startsWith("/api/")) {
    // Clone the response and add CORS headers
    const response = NextResponse.next()

    // Add CORS headers
    response.headers.set("Access-Control-Allow-Credentials", "true")
    response.headers.set("Access-Control-Allow-Origin", "*") // Adjust this in production
    response.headers.set("Access-Control-Allow-Methods", "GET,DELETE,PATCH,POST,PUT")
    response.headers.set(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
    )

    return response
  }

  return NextResponse.next()
}

// Configure the middleware to run only for API routes
export const config = {
  matcher: "/api/:path*",
}
