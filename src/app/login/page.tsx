'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PRESET_USERS, useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const destination = searchParams.get('next')?.startsWith('/') ? searchParams.get('next')! : '/';

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-purple-600">Demo access</p>
        <h1 className="text-3xl font-black text-slate-900">Choose a profile</h1>
        <p className="text-sm text-slate-500">This is a local mock marketplace—no account or payment details are required.</p>
      </div>
      <div className="space-y-3">
        {PRESET_USERS.map((profile) => (
          <button
            key={profile.id}
            onClick={() => {
              login(profile);
              router.replace(destination);
            }}
            className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-purple-300 hover:shadow-sm transition"
          >
            <span className="block font-bold text-slate-900">Continue as {profile.name}</span>
            <span className="block text-xs text-slate-500 mt-1">{profile.role} · {profile.email}</span>
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-slate-500">Want to browse first? <Link href="/auctions" className="font-bold text-purple-600">Explore auctions</Link></p>
    </div>
  );
}
