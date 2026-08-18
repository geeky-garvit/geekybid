'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
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

  // Fetch session from JWT cookie via /api/auth/me
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();

      if (res.ok && data.success && data.user) {
        setUser(data.user);
        loadUserWatchlist(data.user.id);
      } else {
        setUser(null);
        setWatchlist([]);
      }
    } catch (err) {
      setUser(null);
      setWatchlist([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const loginUser = (newUser: User) => {
    setUser(newUser);
    loadUserWatchlist(newUser.id);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setWatchlist([]);
      window.location.href = '/login';
    }
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
        refreshUser,
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