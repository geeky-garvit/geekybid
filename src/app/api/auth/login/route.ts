import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, verifyUserPassword } from '@/lib/users';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || !body.email || !body.password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const { email, password } = body;
    const userDoc = await findUserByEmail(email);

    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const isValid = await verifyUserPassword(password, userDoc.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: userDoc.id, email: userDoc.email, role: userDoc.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    const userPayload = {
      id: userDoc.id,
      name: userDoc.name,
      email: userDoc.email,
      avatar: userDoc.avatar,
      role: userDoc.role,
    };

    const response = NextResponse.json({
      success: true,
      user: userPayload,
    });

    // Set HTTP-Only Cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login API Error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}