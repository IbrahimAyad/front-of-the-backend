import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory metrics for edge runtime
const metrics = {
  requests: 0,
  errors: 0,
  slowRequests: 0
};

export function middleware(request: NextRequest) {
  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    
    // Clone the response to add headers
    const response = NextResponse.next();
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Add monitoring headers
    response.headers.set('X-Request-ID', requestId);
    response.headers.set('X-Response-Time-Start', startTime.toString());
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers });
    }
    
    // Track metrics
    metrics.requests++;
    
    // Log slow requests (this is async but we don't await)
    if (typeof window === 'undefined') {
      setTimeout(() => {
        const duration = Date.now() - startTime;
        if (duration > 1000) {
          metrics.slowRequests++;
          console.warn(`[Middleware] Slow request: ${request.url} took ${duration}ms`);
        }
      }, 0);
    }
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};