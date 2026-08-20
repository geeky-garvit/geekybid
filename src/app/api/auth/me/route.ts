import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { findUserByEmail } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, user: null },
        { status: 401, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    
    // 🔑 Fix: Force email to lowercase for exact database match
    const userDoc = await findUserByEmail(decoded.email.toLowerCase().trim());

    if (!userDoc) {
      return NextResponse.json(
        { success: false, user: null },
        { status: 401, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: userDoc.id,
          name: userDoc.name || '',
          email: userDoc.email,
          avatar: userDoc.avatar || '',
          role: userDoc.role || 'user',
        },
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    console.error('Session verify failed:', error);
    return NextResponse.json(
      { success: false, user: null },
      { status: 401, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}