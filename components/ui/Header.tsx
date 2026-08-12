'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-purple-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-xl bg-purple-600 flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:bg-purple-700 transition-colors">
            G
          </div>
          <span className="font-extrabold text-xl text-purple-950 tracking-tight">
            Geeky<span className="text-purple-600">Bid</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-6">
          <Link 
            href="/" 
            className="text-sm font-semibold text-purple-900/80 hover:text-purple-600 transition-colors"
          >
            Explore
          </Link>
          <button className="px-4 py-2 text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm transition-colors">
            Post Auction
          </button>
        </nav>
      </div>
    </header>
  );
}
