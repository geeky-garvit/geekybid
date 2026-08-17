'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface AppNotification { id: string; title: string; detail: string; createdAt: string; read: boolean }
interface NotificationContextValue { notifications: AppNotification[]; unreadCount: number; notify: (title: string, detail: string) => void; markAllRead: () => void; clearNotifications: () => void }
const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);
const KEY = 'geekybid_notifications';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  useEffect(() => { try { setNotifications(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { setNotifications([]); } }, []);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(notifications)); }, [notifications]);
  const notify = useCallback((title: string, detail: string) => setNotifications((current) => [{ id: `note-${Date.now()}`, title, detail, createdAt: new Date().toISOString(), read: false }, ...current].slice(0, 30)), []);
  const markAllRead = useCallback(() => setNotifications((current) => current.map((item) => ({ ...item, read: true }))), []);
  const clearNotifications = useCallback(() => setNotifications([]), []);
  const value = useMemo(() => ({ notifications, unreadCount: notifications.filter((item) => !item.read).length, notify, markAllRead, clearNotifications }), [notifications, notify, markAllRead, clearNotifications]);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
export function useNotifications() { const context = useContext(NotificationContext); if (!context) throw new Error('useNotifications must be used within NotificationProvider'); return context; }
