import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserByUsername } from '@lib/database/user';
import { AuthCredentials } from '@lib/types';
import { config } from '@lib/config';

export async function POST(request: NextRequest) {
  try {
    const { username, password }: AuthCredentials = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const adminUsername = config.auth.username!;
    const adminPassword = config.auth.password!;

    if (username === adminUsername && password === adminPassword) {
      const adminToken = jwt.sign(
        {
          userId: 'admin',
          username: adminUsername,
          isAdmin: true
        },
        config.jwt.secret!,
        { expiresIn: '24h' }
      );

      return NextResponse.json({
        message: 'Admin login successful',
        token: adminToken,
        user: {
          id: 'admin',
          username: adminUsername,
          isAdmin: true
        }
      });
    }

    const user = await getUserByUsername(username);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      },
      config.jwt.secret!,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 