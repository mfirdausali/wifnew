import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/working-login',
  '/test-login',
  '/test-simple-login',
  '/test-auth-login',
  '/test-cookies',
];

// Define protected routes and their required roles
const protectedRoutes = {
  '/admin': ['ADMIN'],
  '/users': ['ADMIN'],
  '/sales': ['SALES_MANAGER', 'ADMIN'],
  '/finance': ['FINANCE_MANAGER', 'ADMIN'],
  '/operations': ['OPERATIONS_MANAGER', 'ADMIN'],
  '/dashboard': ['ADMIN', 'SALES_MANAGER', 'FINANCE_MANAGER', 'OPERATIONS_MANAGER']
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log('[Middleware] Processing request for:', pathname);
  
  // Skip middleware for test routes
  if (pathname.includes('/test-') || pathname.includes('/working-') || pathname.includes('/debug-')) {
    return NextResponse.next();
  }
  
  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // Get the JWT token from cookies
  const accessToken = request.cookies.get('accessToken')?.value;
  const allCookies = request.cookies.getAll();
  
  console.log('[Middleware] Route info:', {
    pathname,
    isPublicRoute,
    hasAccessToken: !!accessToken,
    accessTokenLength: accessToken?.length,
    allCookieNames: allCookies.map(c => c.name)
  });
  
  // If no token and trying to access protected route, redirect to login
  if (!accessToken && !isPublicRoute && pathname !== '/') {
    console.log('[Middleware] No token, redirecting to login');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If has token and trying to access auth routes, redirect to home
  if (accessToken && (pathname === '/login' || pathname === '/register')) {
    console.log('[Middleware] Has token, redirecting from auth route to home');
    // Let the AuthContext handle role-based redirection
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Redirect root to login if not authenticated
  if (pathname === '/' && !accessToken) {
    console.log('[Middleware] No token at root, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  console.log('[Middleware] Allowing request to proceed');
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
     * - fonts (font files)
     * - public folder
     * - api routes (handled separately)
     * - .well-known (browser specific files)
     */
    '/((?!_next/static|_next/image|favicon.ico|fonts|public|api|\\.well-known).*)',
  ],
};