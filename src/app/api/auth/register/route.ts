import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, createUser } from '@/lib/users';

export const dynamic = 'force-dynamic'; // Ensures route isn't evaluated at build time

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'All fields are required.' },
        { status: 400 }
      );
    }

    // Sanitize input
    const cleanEmail = email.toLowerCase().trim();

    // Check existing user
    const existingUser = await findUserByEmail(cleanEmail);
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'An account with this email/username already exists.' },
        { status: 400 }
      );
    }

    const newUser = await createUser({
      id: `user_${Date.now()}`,
      name,
      email: cleanEmail,
      password,
      avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      role: 'user',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error('PROD Registration Error Log:', error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Server error during account creation.',
      },
      { status: 500 }
    );
  }
}