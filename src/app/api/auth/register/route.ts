import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, createUser } from '@/lib/users';

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

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'An account with this email/username already exists.' },
        { status: 400 }
      );
    }

    const newUser = await createUser({
      id: `user_${Date.now()}`,
      name,
      email: email.toLowerCase().trim(),
      password, // Note: Hash with bcrypt in production
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
    console.error('Registration Route Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Internal server error while creating account.',
      },
      { status: 500 }
    );
  }
}