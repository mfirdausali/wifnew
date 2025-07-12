import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Call backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    const response = await fetch(`${backendUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': `req-${Date.now()}`,
        'x-request-time': new Date().toISOString(),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      const { user, tokens } = data.data;
      
      // Set cookies server-side in Next.js
      // This guarantees cookies are available immediately
      const cookieStore = await cookies();
      
      cookieStore.set('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 86400, // 1 day in seconds
        path: '/',
      });

      cookieStore.set('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 604800, // 7 days in seconds
        path: '/',
      });

      // Return only user data (tokens are in httpOnly cookies)
      return NextResponse.json({ 
        success: true, 
        data: { user } 
      });
    }

    // Forward error response
    return NextResponse.json(data, { status: response.status });
    
  } catch (error: any) {
    console.error('[API Route] Login error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Internal server error',
          details: error.message 
        } 
      },
      { status: 500 }
    );
  }
}