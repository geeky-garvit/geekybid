'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth, MOCK_PROFILES, UserProfile } from '@/context/AuthContext';

export default function UserSwitcherModal() {
  const { user, switchUser, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Current User Pill / Trigger */}
      {user ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 bg-slate-100 hover:bg-slate-200 p-1.5 pr-3 rounded-full transition border border-slate-200"
        >
          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-purple-100 border border-purple-300">
            <Image src={user.avatar} alt={user.name} fill className="object-cover" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold text-slate-800 leading-none">{user.name}</p>
            <p className="text-[10px] font-semibold text-purple-600 leading-tight">{user.role}</p>
          </div>
          <span className="text-xs text-slate-400">▼</span>
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm"
        >
          Sign In
        </button>
      )}

      {/* Modal Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="border-b pb-2 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  Switch Profile
                </h3>
                <p className="text-[10px] text-slate-500">Select an account to test bidding</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Profile List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {MOCK_PROFILES.map((profile: UserProfile) => {
                const isActive = user?.id === profile.id;
                return (
                  <button
                    key={profile.id}
                    onClick={() => {
                      switchUser(profile);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl transition text-left ${
                      isActive
                        ? 'bg-purple-50 border border-purple-200'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-100 border">
                        <Image src={profile.avatar} alt={profile.name} fill />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{profile.name}</p>
                        <p className="text-[10px] text-slate-500">{profile.email}</p>
                      </div>
                    </div>
                    {isActive && <span className="text-xs text-purple-600 font-bold">Active</span>}
                  </button>
                );
              })}
            </div>

            {/* Footer Action */}
            {user && (
              <div className="border-t pt-2">
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="w-full text-center text-xs font-bold text-rose-600 hover:bg-rose-50 py-2 rounded-xl transition"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}