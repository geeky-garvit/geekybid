import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { findUserByEmail } from '@/lib/users';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    const userDoc = await findUserByEmail(decoded.email);

    if (!userDoc) {
      return NextResponse.json({ success: false, user: null }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userDoc.id,
        name: userDoc.name,
        email: userDoc.email,
        avatar: userDoc.avatar,
        role: userDoc.role,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, user: null }, { status: 401 });
  }
}