import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, createUser } from '@/lib/users';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const avatarSeed = encodeURIComponent(name);
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newUser = await createUser({
      id: userId,
      name,
      email,
      password,
      avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${avatarSeed}`,
      role: 'Member',
    });

    const userPayload = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      avatar: newUser.avatar,
      role: newUser.role,
    };

    return NextResponse.json({
      success: true,
      user: userPayload,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}