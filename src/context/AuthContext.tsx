// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role?: string;
}

export const PRESET_USERS: User[] = [
  {
    id: 'user_bidder1',
    name: 'Alex Vance',
    email: 'alex@example.com',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Alex',
    role: 'Pro Bidder',
  },
  {
    id: 'user_seller1',
    name: 'Sarah Connor',
    email: 'sarah@example.com',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah',
    role: 'Power Seller',
  },
  {
    id: 'user_bidder2',
    name: 'David Light',
    email: 'david@example.com',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=David',
    role: 'Collector',
  },
  {
    id: 'user_bidder3',
    name: 'Elena Rostova',
    email: 'elena@example.com',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Elena',
    role: 'Art Enthusiast',
  },
];

interface AuthContextType {
  user: User | null;
  watchlist: string[];
  login: (user: User) => void;
  switchUser: (user: User) => void;
  logout: () => void;
  toggleWatchlist: (auctionId: string) => void;
  isWatchlisted: (auctionId: string) => boolean;
  presetUsers: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Helper to load watchlist specific to a given user ID
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
        setUser(PRESET_USERS[0]);
        loadUserWatchlist(PRESET_USERS[0].id);
      }
    } else {
      setUser(PRESET_USERS[0]);
      localStorage.setItem('geekybid_user', JSON.stringify(PRESET_USERS[0]));
      loadUserWatchlist(PRESET_USERS[0].id);
    }
    setIsLoaded(true);
  }, []);

  const login = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('geekybid_user', JSON.stringify(newUser));
    loadUserWatchlist(newUser.id); // Load the new profile's specific watchlist
  };

  const logout = () => {
    setUser(null);
    setWatchlist([]); // Clear interface state on logout
    localStorage.removeItem('geekybid_user');
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

  if (!isLoaded) return null;

  return (
    <AuthContext.Provider
      value={{
        user,
        watchlist,
        login,
        switchUser: login,
        logout,
        toggleWatchlist,
        isWatchlisted,
        presetUsers: PRESET_USERS,
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