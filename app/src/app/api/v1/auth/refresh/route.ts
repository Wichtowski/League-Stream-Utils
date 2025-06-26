import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, generateTokens, setSecurityHeaders } from '@lib/auth';
import { getClientIP } from '@lib/utils/security';
import { logSecurityEvent } from '@lib/database/security';

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  try {
    // Get refresh token from cookie
    const refreshToken = request.cookies.get('refresh_token')?.value;
    
    if (!refreshToken) {
      return setSecurityHeaders(NextResponse.json(
        { error: 'Refresh token required' },
        { status: 401 }
      ));
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken, 'refresh');
    if (!decoded) {
      await logSecurityEvent({
        timestamp: new Date(),
        event: 'invalid_refresh_token',
        ip,
        userAgent,
        details: {}
      });

      return setSecurityHeaders(NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      ));
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      userId: decoded.userId,
      username: decoded.username,
      isAdmin: decoded.isAdmin
    });

    await logSecurityEvent({
      timestamp: new Date(),
      event: 'token_refresh_success',
      userId: decoded.userId,
      ip,
      userAgent,
      details: {}
    });

    const response = NextResponse.json({
      message: 'Tokens refreshed successfully'
    });

    // Set new httpOnly cookies
    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour
      path: '/'
    });

    response.cookies.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    return setSecurityHeaders(response);

  } catch (error) {
    console.error('Token refresh error:', error);
    
    await logSecurityEvent({
      timestamp: new Date(),
      event: 'token_refresh_error',
      ip,
      userAgent,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    });

    return setSecurityHeaders(NextResponse.json(
      { error: 'Token refresh failed' },
      { status: 500 }
    ));
  }
} 