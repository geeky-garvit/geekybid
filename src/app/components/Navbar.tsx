// src/components/Navbar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, watchlist, login, logout, presetUsers } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-black text-purple-950 flex items-center gap-2">
          <span>⚡</span> GeekyBid
        </Link>

        <nav className="flex items-center gap-6 text-xs font-bold text-slate-600">
          <Link href="/auctions" className="hover:text-purple-600 transition">
            Explore Marketplace
          </Link>
          <Link href="/watchlist" className="hover:text-purple-600 transition flex items-center gap-1.5">
            <span>❤️ Watchlist</span>
            {watchlist.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {watchlist.length}
              </span>
            )}
          </Link>
          <Link href="/seller/dashboard" className="hover:text-purple-600 transition">
            Seller Dashboard
          </Link>
        </nav>

        {/* User Account Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border">
                <div className="relative w-6 h-6 rounded-full overflow-hidden border">
                  <Image src={user.avatar} alt={user.name} fill />
                </div>
                <span className="text-xs font-bold text-slate-800">{user.name}</span>
              </div>
              <button
                onClick={logout}
                className="text-xs font-semibold text-slate-400 hover:text-slate-700"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Login as:</span>
              {presetUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => login(u)}
                  className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold px-2.5 py-1 rounded-lg transition"
                >
                  {u.name.split(' ')[0]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}