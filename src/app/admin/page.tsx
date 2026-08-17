'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { store, initializeStore, Auction, Order } from '@/lib/store';
import AdminMetrics from '../components/AdminMetrics';
import AdminAuctionsTable from '../components/AdminAuctionsTable';
import AdminOrdersTable from '../components/AdminOrdersTable';
import {
  adminCloseAuctionAction,
  adminDeleteAuctionAction,
  adminTogglePaymentStatusAction,
} from '@/app/actions/auction';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'auctions' | 'orders'>('auctions');
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function loadAdminData() {
      await initializeStore();
      setAuctions([...store.auctions]);
      setOrders([...store.orders]);
      setLoading(false);
    }
    loadAdminData();
  }, []);

  const handleCloseAuction = useCallback(async (auctionId: string) => {
    const res = await adminCloseAuctionAction(auctionId);
    if (res.success) {
      setAuctions((prev) =>
        prev.map((item) => (item.id === auctionId ? { ...item, status: 'ended' } : item))
      );
    } else {
      alert(res.error || 'Failed to close auction');
    }
  }, []);

  const handleDeleteAuction = useCallback(async (auctionId: string) => {
    if (!confirm('Are you sure you want to delete this auction listing?')) return;
    const res = await adminDeleteAuctionAction(auctionId);
    if (res.success) {
      setAuctions((prev) => prev.filter((item) => item.id !== auctionId));
    } else {
      alert(res.error || 'Failed to delete auction');
    }
  }, []);

  const handleTogglePaymentStatus = useCallback(async (orderId: string) => {
    const res = await adminTogglePaymentStatusAction(orderId);
    if (res.success) {
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, isPaid: !order.isPaid } : order))
      );
    } else {
      alert(res.error || 'Failed to toggle order status');
    }
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