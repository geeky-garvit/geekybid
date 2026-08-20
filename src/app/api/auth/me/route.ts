import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { findUserByEmail } from '@/lib/db';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    // 🔑 Make sure JWT_SECRET matches what was used during login
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    const userDoc = await findUserByEmail(decoded.email);

    if (!userDoc) {
      return NextResponse.json({ success: false, user: null }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userDoc.id,
        name: userDoc.name || '',
        email: userDoc.email,
        avatar: userDoc.avatar || '',
        role: userDoc.role || 'user',
      },
    });
  } catch (error) {
    // Log the error to your console so you can see why verify failed!
    console.error('Session verify failed:', error);
    return NextResponse.json({ success: false, user: null }, { status: 401 });
  }
}