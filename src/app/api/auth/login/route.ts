import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, logUserActivity } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || !body.email || !body.password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // 🔑 Fix: Normalize email
    const email = body.email.toLowerCase().trim();
    const { password } = body;

    // 1. Fetch user from MongoDB
    const userDoc = await findUserByEmail(email);
    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials.' },
        { status: 401 }
      );
    }

    // 2. Validate hashed password
    const isValid = await bcrypt.compare(password, userDoc.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials.' },
        { status: 401 }
      );
    }

    // 3. Log login activity in MongoDB
    await logUserActivity({
      userId: userDoc.id,
      action: 'USER_LOGGED_IN',
      details: `Logged in from IP: ${request.headers.get('x-forwarded-for') || 'localhost'}`,
    });

    // 4. Issue JWT Token (pass normalized email)
    const token = jwt.sign(
      { userId: userDoc.id, email: userDoc.email.toLowerCase(), role: userDoc.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const safeUser = {
      id: userDoc.id,
      name: userDoc.name,
      email: userDoc.email,
      avatar: userDoc.avatar,
      role: userDoc.role,
    };

    const response = NextResponse.json({ success: true, user: safeUser });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}