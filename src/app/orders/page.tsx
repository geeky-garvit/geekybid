'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import OrderCard, { Order } from './components/OrderCard';

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchOrders() {
      try {
        const res = await fetch(`/api/orders?userId=${user?.id}`);
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err) {
        console.error('Failed fetching orders:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Order History</h1>
        <p className="text-slate-500 text-sm">Please log in to view your orders.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>

      {orders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <p className="text-slate-500 text-sm">You have no order history yet.</p>
          <Link
            href="/auctions"
            className="inline-block bg-purple-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-purple-700 transition"
          >
            Explore Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}