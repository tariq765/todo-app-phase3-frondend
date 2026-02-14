import { NextRequest, NextResponse } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = ['/', '/login', '/register'];

export function middleware(request: NextRequest) {
  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname === route ||
    request.nextUrl.pathname.startsWith(`${route}/`)
  );

  // Get the auth token from cookies or localStorage (client-side)
  // Since middleware runs server-side, we need to check headers or cookies
  const authToken = request.cookies.get('auth_token')?.value ||
                   request.headers.get('authorization')?.replace('Bearer ', '');

  // If user is trying to access a protected route without authentication
  if (!isPublicRoute && !authToken) {
    // Redirect to login page
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Apply middleware to all routes except static assets
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};