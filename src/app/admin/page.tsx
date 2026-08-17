'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { store, initializeStore, Auction, Order, closeExpiredAuctions, deleteAuction, setOrderPaymentStatus, subscribeToStore } from '@/lib/store';
import AdminMetrics from '../components/AdminMetrics';
import AdminAuctionsTable from '../components/AdminAuctionsTable';
import AdminOrdersTable from '../components/AdminOrdersTable';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'auctions' | 'orders'>('auctions');
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [passkey, setPasskey] = useState('');
  const [passkeyError, setPasskeyError] = useState('');

  useEffect(() => {
    setAdminUnlocked(sessionStorage.getItem('geekybid_admin_unlocked') === 'true');
    async function loadAdminData() {
      await initializeStore();
      setAuctions([...store.auctions]);
      setOrders([...store.orders]);
      setLoading(false);
    }
    loadAdminData();
    return subscribeToStore(() => { setAuctions([...store.auctions]); setOrders([...store.orders]); });
  }, []);

  const handleCloseAuction = useCallback((auctionId: string) => {
    const auction = store.auctions.find(item => item.id === auctionId);
    if (auction) { auction.endTime = new Date().toISOString(); closeExpiredAuctions(); setAuctions([...store.auctions]); setOrders([...store.orders]); }
  }, []);

  const handleDeleteAuction = useCallback((auctionId: string) => {
    if (!confirm('Are you sure you want to delete this auction listing?')) return;
    deleteAuction(auctionId); setAuctions((prev) => prev.filter((item) => item.id !== auctionId));
  }, []);

  const handleTogglePaymentStatus = useCallback((orderId: string) => {
    const order = store.orders.find(order => order.id === orderId);
    if (!order) return;
    setOrderPaymentStatus(orderId, !order.isPaid);
    setOrders([...store.orders]); setAuctions([...store.auctions]);
  }, []);

  const totalRevenue = useMemo(
    () =>
      orders
        .filter((order) => order.isPaid)
        .reduce((sum, order) => sum + (order.amount || 0), 0),
    [orders]
  );

  const liveAuctionsCount = useMemo(
    () => auctions.filter((auction) => auction.status === 'live').length,
    [auctions]
  );

  if (!adminUnlocked) {
    return <div className="max-w-md mx-auto px-4 py-20"><form onSubmit={(event) => { event.preventDefault(); if (passkey === 'ankur sir jindabad') { sessionStorage.setItem('geekybid_admin_unlocked', 'true'); setAdminUnlocked(true); } else setPasskeyError('Incorrect passkey.'); }} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-7 space-y-4"><div><h1 className="text-xl font-black text-slate-900">Admin access</h1><p className="text-xs text-slate-500 mt-1">Enter the passkey to open the admin console.</p></div><input type="password" autoFocus value={passkey} onChange={(event) => { setPasskey(event.target.value); setPasskeyError(''); }} placeholder="Passkey" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-600" />{passkeyError && <p className="text-xs font-semibold text-rose-600">{passkeyError}</p>}<button className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white hover:bg-purple-700">Unlock Admin</button></form></div>;
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto" />
        <p className="text-xs font-semibold text-slate-500 mt-3">Loading admin metrics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Admin Console</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage product listings, monitor revenue, and handle store orders.
          </p>
        </div>
        <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1.5 rounded-full">
          Super Admin Mode
        </span>
      </div>

      <AdminMetrics
        totalRevenue={totalRevenue}
        totalOrders={orders.length}
        liveAuctionsCount={liveAuctionsCount}
        totalAuctionsCount={auctions.length}
      />

      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('auctions')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'auctions'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Auctions Management ({auctions.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'orders'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Orders Log ({orders.length})
        </button>
      </div>

      {activeTab === 'auctions' ? (
        <AdminAuctionsTable
          auctions={auctions}
          onCloseAuction={handleCloseAuction}
          onDeleteAuction={handleDeleteAuction}
        />
      ) : (
        <AdminOrdersTable
          orders={orders}
          onTogglePaymentStatus={handleTogglePaymentStatus}
        />
      )}
    </div>
  );
}
