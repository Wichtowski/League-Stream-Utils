import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { canUserCreateSession, updateUserSessionCount } from './database';
import { JWTPayload } from './types/auth';
import { config } from '@lib/config';

export function withAuth(handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const authHeader = request.headers.get('authorization');
    const electronLocalMode = request.headers.get('x-electron-local-mode');

    // Skip authentication for Electron local data mode
    if (electronLocalMode === 'true') {
      const localUser: JWTPayload = {
        userId: 'electron-local-user',
        username: 'electron-local',
        isAdmin: true // Grant admin privileges for local mode
      };
      return handler(request, localUser);
    }

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, config.jwt.secret!) as JWTPayload;
        return handler(request, decoded);
      } else if (authHeader.startsWith('Basic ')) {
        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [username, password] = credentials.split(':');

        const adminUsername = config.auth.username!;
        const adminPassword = config.auth.password!;

        if (username === adminUsername && password === adminPassword) {
          const adminUser: JWTPayload = {
            userId: 'admin',
            username: adminUsername,
            isAdmin: true
          };
          return handler(request, adminUser);
        } else {
          return NextResponse.json(
            { error: 'Invalid credentials' },
            { status: 401 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Invalid authentication format' },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
  };
}

export async function withSessionLimit(handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse>) {
  return withAuth(async (request: NextRequest, user: JWTPayload) => {
    if (user.isAdmin) {
      return handler(request, user);
    }

    const canCreate = await canUserCreateSession(user.userId);
    if (!canCreate) {
      return NextResponse.json(
        { error: 'Daily session limit reached (2 sessions per day)' },
        { status: 429 }
      );
    }

    if (request.method === 'POST') {
      await updateUserSessionCount(user.userId);
    }

    return handler(request, user);
  });
} 