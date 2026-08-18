'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  watchlist: string[];
  loginUser: (user: User) => void;
  logout: () => void;
  toggleWatchlist: (auctionId: string) => void;
  isWatchlisted: (auctionId: string) => boolean;
  isLoaded: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadUserWatchlist = (userId: string) => {
    const saved = localStorage.getItem(`geekybid_watchlist_${userId}`);
    if (saved) {
      try {
        setWatchlist(JSON.parse(saved));
      } catch {
        setWatchlist([]);
      }
    } else {
      setWatchlist([]);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('geekybid_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        loadUserWatchlist(parsed.id);
      } catch {
        setUser(null);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (user) {
      document.cookie = `user_session=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400; SameSite=Lax`;
    } else {
      document.cookie = 'user_session=; path=/; max-age=0; SameSite=Lax';
    }
  }, [user]);

  const loginUser = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('geekybid_user', JSON.stringify(newUser));
    loadUserWatchlist(newUser.id);
  };

  const logout = () => {
    setUser(null);
    setWatchlist([]);
    localStorage.removeItem('geekybid_user');
    document.cookie = 'user_session=; path=/; max-age=0; SameSite=Lax';
  };

  const toggleWatchlist = (auctionId: string) => {
    if (!user) return;
    setWatchlist((prev) => {
      const next = prev.includes(auctionId)
        ? prev.filter((id) => id !== auctionId)
        : [...prev, auctionId];
      localStorage.setItem(`geekybid_watchlist_${user.id}`, JSON.stringify(next));
      return next;
    });
  };

  const isWatchlisted = (auctionId: string) => watchlist.includes(auctionId);

  return (
    <AuthContext.Provider
      value={{
        user,
        watchlist,
        loginUser,
        logout,
        toggleWatchlist,
        isWatchlisted,
        isLoaded,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}