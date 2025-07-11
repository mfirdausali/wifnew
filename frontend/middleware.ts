import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
];

// Define protected routes and their required roles
const protectedRoutes = {
  '/admin': ['ADMIN'],
  '/users': ['ADMIN'],
  '/sales': ['SALES', 'ADMIN'],
  '/finance': ['FINANCE', 'ADMIN'],
  '/operations': ['OPERATIONS', 'ADMIN'],
  '/dashboard': ['ADMIN', 'SALES', 'FINANCE', 'OPERATIONS']
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // Get the JWT token from cookies
  const accessToken = request.cookies.get('accessToken')?.value;
  
  // If no token and trying to access protected route, redirect to login
  if (!accessToken && !isPublicRoute && pathname !== '/') {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If has token and trying to access auth routes, redirect to dashboard
  if (accessToken && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Redirect root to login or dashboard based on auth status
  if (pathname === '/') {
    if (accessToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // Note: Role-based access control will be handled by components
  // since we can't decode JWT in middleware without the secret
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};