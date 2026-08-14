// src/lib/auth.ts
import { cookies } from 'next/headers';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export const MOCK_USERS: UserSession[] = [
  {
    id: 'usr_1',
    name: 'Sarah Connor',
    email: 'sarah@auction.com',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah',
  },
  {
    id: 'usr_2',
    name: 'Alex Vance',
    email: 'alex@auction.com',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Alex',
  },
  {
    id: 'usr_3',
    name: 'David Light',
    email: 'david@auction.com',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=David',
  },
];

export async function getCurrentUser(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session')?.value;
  if (!sessionCookie) return null;

  try {
    return JSON.parse(sessionCookie) as UserSession;
  } catch {
    return null;
  }
}