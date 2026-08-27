'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AdminMetrics from '../components/AdminMetrics';
import AdminAuctionsTable from '../components/AdminAuctionsTable';
import AdminOrdersTable from '../components/AdminOrdersTable';
import { adminCloseAuctionAction, adminDeleteAuctionAction } from '@/app/actions/auction';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'auctions' | 'orders'>('auctions');
  const [auctions, setAuctions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [passkey, setPasskey] = useState('');
  const [passkeyError, setPasskeyError] = useState('');

  // 1. Fetch live data from PostgreSQL via our API routes
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auctions?status=all&limit=100');
      const data = await res.json();
      
      if (data.success) {
        setAuctions(data.data || []);
      }
      
      // Fetch orders if an API endpoint exists, or fallback to an empty list
      const ordersRes = await fetch('/api/orders');
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.orders || []);
      }
    } catch (err) {
      console.error('Failed to load admin data from database:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setAdminUnlocked(sessionStorage.getItem('geekybid_admin_unlocked') === 'true');
    fetchDashboardData();
  }, [fetchDashboardData]);

  // 2. Handle Closing Auctions via Server Action
  const handleCloseAuction = useCallback(async (auctionId: string) => {
    const result = await adminCloseAuctionAction(auctionId);
    if (result.success) {
      setAuctions((prev) =>
        prev.map((item) =>
          item.id === auctionId ? { ...item, status: 'ENDED' } : item
        )
      );
    } else {
      alert(result.error || 'Failed to close auction');
    }
  }, []);

  // 3. Handle Deleting Auctions via Server Action
  const handleDeleteAuction = useCallback(async (auctionId: string) => {
    if (!confirm('Are you sure you want to delete this auction listing?')) return;
    
    const result = await adminDeleteAuctionAction(auctionId);
    if (result.success) {
      setAuctions((prev) => prev.filter((item) => item.id !== auctionId));
    } else {
      alert(result.error || 'Failed to delete auction');
    }
  }, []);

  // 4. Handle Payment Status Toggle
  const handleTogglePaymentStatus = useCallback(async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/toggle-payment`, {
        method: 'PATCH',
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, isPaid: !order.isPaid } : order
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle payment status:', err);
    }
  }, []);

  // 5. Compute real metrics based on DB state
  const totalRevenue = useMemo(
    () =>
      orders
        .filter((order) => order.isPaid)
        .reduce((sum, order) => sum + (order.amount || 0), 0),
    [orders]
  );

  const liveAuctionsCount = useMemo(
    () => auctions.filter((auction) => auction.status === 'ACTIVE').length,
    [auctions]
  );

  if (!adminUnlocked) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (passkey === 'ankur sir jindabad') {
              sessionStorage.setItem('geekybid_admin_unlocked', 'true');
              setAdminUnlocked(true);
            } else {
              setPasskeyError('Incorrect passkey.');
            }
          }}
          className="bg-white border border-slate-200 rounded-2xl shadow-sm p-7 space-y-4"
        >
          <div>
            <h1 className="text-xl font-black text-slate-900">Admin access</h1>
            <p className="text-xs text-slate-500 mt-1">
              Enter the passkey to open the admin console.
            </p>
          </div>
          <input
            type="password"
            autoFocus
            value={passkey}
            onChange={(event) => {
              setPasskey(event.target.value);
              setPasskeyError('');
            }}
            placeholder="Passkey"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-600"
          />
          {passkeyError && (
            <p className="text-xs font-semibold text-rose-600">{passkeyError}</p>
          )}
          <button className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white hover:bg-purple-700">
            Unlock Admin
          </button>
        </form>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto" />
        <p className="text-xs font-semibold text-slate-500 mt-3">
          Loading admin metrics from database...
        </p>
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