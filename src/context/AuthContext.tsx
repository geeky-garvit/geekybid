'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role?: string;
}

// Aliased type to match UserSwitcherModal imports
export type UserProfile = User;

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

// Aliased array to match UserSwitcherModal imports
export const MOCK_PROFILES = PRESET_USERS;

interface AuthContextType {
  user: User | null;
  watchlist: string[];
  login: (user: User) => void;
  switchUser: (user: User) => void; // Added for UserSwitcherModal compatibility
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

  // Restore user & watchlist from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('geekybid_user');
    const savedWatchlist = localStorage.getItem('geekybid_watchlist');

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(PRESET_USERS[0]);
      }
    } else {
      // Default logged in as Alex Vance for instant testing
      setUser(PRESET_USERS[0]);
      localStorage.setItem('geekybid_user', JSON.stringify(PRESET_USERS[0]));
    }

    if (savedWatchlist) {
      try {
        setWatchlist(JSON.parse(savedWatchlist));
      } catch {
        setWatchlist([]);
      }
    }

    setIsLoaded(true);
  }, []);

  const login = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('geekybid_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('geekybid_user');
  };

  const toggleWatchlist = (auctionId: string) => {
    setWatchlist((prev) => {
      const next = prev.includes(auctionId)
        ? prev.filter((id) => id !== auctionId)
        : [...prev, auctionId];
      localStorage.setItem('geekybid_watchlist', JSON.stringify(next));
      return next;
    });
  };

  const isWatchlisted = (auctionId: string) => watchlist.includes(auctionId);

  if (!isLoaded) return null; // Avoid hydration mismatch

  return (
    <AuthContext.Provider
      value={{
        user,
        watchlist,
        login,
        switchUser: login, // Maps switchUser directly to login
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