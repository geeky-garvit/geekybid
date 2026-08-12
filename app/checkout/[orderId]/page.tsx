'use client';

import { use, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface OrderDetails {
  orderId: string;
  auctionTitle: string;
  category: string;
  image: string;
  winningBid: number;
  platformFee: number;
  shippingFee: number;
  sellerName: string;
}

export default function WinnerCheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);

  // Mock order state fetched from database
  const [order] /* state setter removed as unused */ = useState<OrderDetails>({
    orderId,
    auctionTitle: 'Vintage Cyberpunk Mechanical Keyboard',
    category: 'Electronics',
    image: 'https://picsum.photos/seed/1/600/600',
    winningBid: 250,
    platformFee: 12.5,
    shippingFee: 15,
    sellerName: 'Seller_1',
  });

  const totalAmount = order.winningBid + order.platformFee + order.shippingFee;

  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handlePaymentSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      // Send payment confirmation request to mock payment webhook API
      const response = await fetch('/api/webhooks/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-payment-signature': `sig_${Date.now()}_mock`,
        },
        body: JSON.stringify({
          orderId: order.orderId,
          amount: totalAmount,
          status: 'paid',
        }),
      });

      if (!response.ok) {
        throw new Error('Payment processing failed');
      }

      setPaymentStatus('success');
    } catch {
      setPaymentStatus('error');
      setErrorMessage('Failed to complete payment. Please try again.');
    }
  }

  if (paymentStatus === 'success') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
          ✓
        </div>
        <h1 className="text-3xl font-black text-purple-950 tracking-tight">Payment Successful!</h1>
        <p className="text-sm text-slate-600">
          Your order <span className="font-mono font-bold text-slate-800">#{orderId}</span> has been paid successfully.
          The seller (<span className="font-semibold text-purple-900">{order.sellerName}</span>) will dispatch your item shortly.
        </p>
        <div className="pt-4">
          <Link
            href="/auctions"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-purple-600/20"
          >
            Back to Marketplace
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="border-b border-purple-100 pb-4">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">
          Winner Checkout
        </span>
        <h1 className="text-3xl font-black text-purple-950 tracking-tight">Complete Your Purchase</h1>
        <p className="text-xs text-purple-900/60">Order #{orderId}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Shipping & Payment Form */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handlePaymentSubmit} className="space-y-6">
            {/* Shipping Address */}
            <div className="bg-white border border-purple-100 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-purple-950 uppercase tracking-wide">
                1. Shipping Address
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    defaultValue="Alex Smith"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    defaultValue="+1 (555) 019-2834"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  defaultValue="742 Evergreen Terrace"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            {/* Payment Options */}
            <div className="bg-white border border-purple-100 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-purple-950 uppercase tracking-wide">
                2. Payment Method
              </h2>
              <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 text-white font-black text-xs flex items-center justify-center">
                    💳
                  </div>
                  <div>
                    <div className="text-xs font-bold text-purple-950">Mock Card Payment</div>
                    <div className="text-[10px] text-purple-900/60">Simulated payment processor</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-purple-700">Selected</span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={paymentStatus === 'processing'}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-purple-600/20 disabled:opacity-50"
            >
              {paymentStatus === 'processing' ? 'Processing Payment...' : `Pay $${totalAmount.toFixed(2)} Now`}
            </button>
          </form>
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-purple-100 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-purple-50 pb-2">
              Order Summary
            </h2>

            <div className="flex gap-3">
              <div className="relative h-14 w-14 rounded-xl bg-purple-50 border border-purple-100 overflow-hidden flex-shrink-0">
                <Image src={order.image} alt={order.auctionTitle} fill className="object-cover" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-purple-950 leading-snug">{order.auctionTitle}</h3>
                <span className="text-[10px] text-slate-500">Seller: {order.sellerName}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-purple-50 text-xs text-slate-600 font-medium">
              <div className="flex justify-between">
                <span>Winning Bid</span>
                <span className="font-bold text-slate-900">${order.winningBid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Buyer Platform Fee (5%)</span>
                <span className="font-bold text-slate-900">${order.platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Shipping</span>
                <span className="font-bold text-slate-900">${order.shippingFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-purple-950 pt-2 border-t border-purple-100">
                <span>Total Due</span>
                <span className="text-purple-600">${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
