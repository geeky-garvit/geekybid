import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, createUser, logUserActivity, createSellerCommunity } from '@/lib/db';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || !body.name || !body.email || !body.password) {
      return NextResponse.json(
        { success: false, message: 'All fields (Name, Email, Password) are required.' },
        { status: 400 }
      );
    }

    // 🔑 Fix: Normalize email
    const email = body.email.toLowerCase().trim();
    const { name, password } = body;

    // 1. Check if account already exists
    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists.' },
        { status: 400 }
      );
    }

    // 2. Persist User document in MongoDB 'users' collection
    const user = await createUser({ name, email, passwordRaw: password });

    // 3. Log account creation in MongoDB 'activity' collection
    await logUserActivity({
      userId: user.id,
      action: 'USER_REGISTERED',
      details: `Account created for ${user.name} (${user.email})`,
    });

    // 4. Provision default Seller Community Hub
    await createSellerCommunity(user.id, `${user.name}'s Collector Hub`);

    // 5. Generate signed JWT session token
    const token = jwt.sign(
      { userId: user.id, email: user.email.toLowerCase(), role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      success: true,
      user,
    });

    // 6. Attach secure HTTP-Only Cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
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