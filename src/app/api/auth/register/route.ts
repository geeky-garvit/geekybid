import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, createUser } from '@/lib/users';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || !body.name || !body.email || !body.password) {
      return NextResponse.json(
        { success: false, message: 'All fields (Name, Email, Password) are required.' },
        { status: 400 }
      );
    }

    const { name, email, password } = body;

    // Check existing account
    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists.' },
        { status: 400 }
      );
    }

    // Save to Mongo
    const user = await createUser({ name, email, passwordRaw: password });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      success: true,
      user,
    });

    // Set HTTP-Only Cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Registration API Error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to create account.' },
      { status: 500 }
    );
  }
}