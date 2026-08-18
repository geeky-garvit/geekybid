import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/users';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || !body.email || !body.password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const { email, password } = body;
    const user = await findUserByEmail(email);

    if (!user || user.password !== password) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role || 'user',
    };

    return NextResponse.json({
      success: true,
      user: userPayload,
    });
  } catch (error: any) {
    console.error('Login Route Error:', error?.stack || error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}