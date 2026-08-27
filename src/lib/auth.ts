import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export interface UserSession {
  id: string;
  name?: string;
  email: string;
  avatar?: string;
  role?: string;
}

export async function getAuthUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId?: string;
      id?: string;
      sub?: string;
      email: string;
      role?: string;
      name?: string;
      avatar?: string;
    };

    // Resolves user ID across different JWT payload naming standards
    const userId = decoded.userId || decoded.id || decoded.sub;

    if (!userId) {
      console.error('[Auth Error]: Valid JWT decoded, but no user ID present.');
      return null;
    }

    return {
      id: userId,
      email: decoded.email,
      name: decoded.name,
      avatar: decoded.avatar,
      role: decoded.role || 'user',
    };
  } catch (error) {
    return null;
  }
}

// Backwards-compatibility export
export const getCurrentUser = getAuthUser;