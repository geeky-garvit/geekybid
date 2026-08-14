// src/app/checkout/page.tsx
'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { getAuctions, Auction } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';

type PaymentStatus = 'idle' | 'processing' | 'webhook_received' | 'completed' | 'failed';

interface WebhookLog {
  id: string;
  event: string;
  status: 'pending' | 'success';
  timestamp: string;
}

export default function WinnerCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ auctionId?: string }>;
}) {
  const query = use(searchParams);
  const searchParamsHook = useSearchParams();
  const { user } = useAuth();

  const auctionId = query.auctionId || searchParamsHook.get('auctionId') || 'auc_1';
  const auction: Auction | undefined = getAuctions().find((a) => a.id === auctionId);

  // Form State
  const [fullName, setFullName] = useState(user?.name || 'Alex Vance');
  const [address, setAddress] = useState('123 Innovation Way, Tech District');
  const [city, setCity] = useState('San Francisco');
  const [zip, setZip] = useState('94105');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card');

  // Payment Webhook Simulation State
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);

  if (!auction) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <span className="text-4xl">🛍️</span>
        <h2 className="text-lg font-bold text-slate-800">No Auction Selected for Checkout</h2>
        <Link href="/auctions" className="inline-block bg-purple-600 text-white font-bold text-xs px-4 py-2 rounded-xl">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  // Cost Calculations
  const winningBid = auction.currentHighestBid;
  const shippingFee = 15.0;
  const estimatedTax = winningBid * 0.08;
  const totalAmount = winningBid + shippingFee + estimatedTax;

  // Trigger Mock Webhook Flow
  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentStatus('processing');
    setWebhookLogs([]);

    const addLog = (event: string) => {
      const log: WebhookLog = {
        id: `wh_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        event,
        status: 'success',
        timestamp: new Date().toLocaleTimeString(),
      };
      setWebhookLogs((prev) => [...prev, log]);
    };

    // Step 1: Initial Payment Intent Created
    await new Promise((resolve) => setTimeout(resolve, 800));
    addLog('payment_intent.created');

    // Step 2: Webhook Authorized
    await new Promise((resolve) => setTimeout(resolve, 1200));
    addLog('charge.authorized');
    setPaymentStatus('webhook_received');

    // Step 3: Webhook Payment Succeeded
    await new Promise((resolve) => setTimeout(resolve, 1000));
    addLog('payment_intent.succeeded');
    setPaymentStatus('completed');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="border-b pb-4 flex justify-between items-center">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
            Winner Checkout
          </span>
          <h1 className="text-xl font-black text-slate-900">Complete Your Order</h1>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span>🔒 256-bit Encrypted</span>
        </div>
      </div>

      {paymentStatus === 'completed' ? (
        /* SUCCESS CONFIRMATION VIEW */
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-2xl mx-auto text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto">
            ✓
          </div>

          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
              Payment Verified via Webhook
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-1">Congratulations on Winning!</h2>
            <p className="text-xs text-slate-500 mt-1">
              Order <span className="font-mono text-purple-900 font-bold">#GB-{Math.floor(100000 + Math.random() * 900000)}</span> has been confirmed.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2">
            <div className="flex justify-between font-bold text-slate-800 pb-2 border-b">
              <span>Item Delivered To:</span>
              <span className="text-purple-600">{fullName}</span>
            </div>
            <p className="text-slate-600">{address}, {city}, {zip}</p>
            <div className="pt-2 flex justify-between font-black text-slate-900 border-t">
              <span>Total Paid:</span>
              <span className="text-purple-950">${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-4 justify-center pt-2">
            <Link
              href="/auctions"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-md shadow-purple-600/20"
            >
              Return to Marketplace
            </Link>
            <Link
              href="/seller/dashboard"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-6 py-3 rounded-xl transition"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      ) : (
        /* MAIN CHECKOUT FORM & SUMMARY */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Side */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleSimulatePayment} className="space-y-6">
              {/* Shipping Address */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  1. Shipping Information
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">City</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">ZIP Code</label>
                      <input
                        type="text"
                        required
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  2. Payment Method
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-xl border text-xs font-bold text-left flex items-center justify-between transition ${
                      paymentMethod === 'card'
                        ? 'border-purple-600 bg-purple-50 text-purple-950'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>💳 Credit Card</span>
                    {paymentMethod === 'card' && <span className="text-purple-600">✓</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('crypto')}
                    className={`p-3 rounded-xl border text-xs font-bold text-left flex items-center justify-between transition ${
                      paymentMethod === 'crypto'
                        ? 'border-purple-600 bg-purple-50 text-purple-950'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>⚡ Instant Crypto</span>
                    {paymentMethod === 'crypto' && <span className="text-purple-600">✓</span>}
                  </button>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl text-[11px] text-slate-500 font-medium">
                  {paymentMethod === 'card'
                    ? '🔒 Standard mock test card will be authorized automatically upon submission.'
                    : '⚡ Simulates an instant smart contract escrow release webhook event.'}
                </div>
              </div>

              <button
                type="submit"
                disabled={paymentStatus !== 'idle'}
                className={`w-full font-bold py-3.5 rounded-xl text-xs transition shadow-md ${
                  paymentStatus !== 'idle'
                    ? 'bg-purple-300 text-white cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20'
                }`}
              >
                {paymentStatus === 'idle'
                  ? `Pay & Complete Order ($${totalAmount.toFixed(2)})`
                  : 'Processing Payment Webhook...'}
              </button>
            </form>
          </div>

          {/* Right Side: Order Summary & Webhook Terminal Simulation */}
          <div className="lg:col-span-5 space-y-6">
            {/* Item Order Summary Card */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Order Summary
              </h3>

              <div className="flex items-center gap-3 pb-4 border-b">
                <div className="relative w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 border">
                  <Image src={auction.images[0]} alt={auction.title} fill className="object-cover" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{auction.title}</h4>
                  <span className="text-[10px] text-purple-600 font-bold uppercase">{auction.category}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs font-medium text-slate-600 border-b pb-4">
                <div className="flex justify-between">
                  <span>Winning Bid Price</span>
                  <span className="font-bold text-slate-900">${winningBid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping & Handling</span>
                  <span className="font-bold text-slate-900">${shippingFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax (8%)</span>
                  <span className="font-bold text-slate-900">${estimatedTax.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-1">
                <span>Total Amount Due</span>
                <span className="text-purple-950 text-base">${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Mock Webhook Activity Simulator Console */}
            <div className="bg-slate-900 text-slate-200 p-5 rounded-2xl font-mono text-[11px] space-y-3 shadow-md border border-slate-800">
              <div className="flex justify-between items-center text-slate-400 pb-2 border-b border-slate-800 text-[10px] uppercase font-bold">
                <span>Webhook Console</span>
                <span className="text-emerald-400">● Live Simulation</span>
              </div>

              {webhookLogs.length === 0 ? (
                <p className="text-slate-500 italic">Submit payment to inspect mock webhook payload logs...</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {webhookLogs.map((log) => (
                    <div key={log.id} className="space-y-0.5">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span className="text-purple-400">[{log.timestamp}]</span>
                        <span className="text-emerald-400">STATUS 200 OK</span>
                      </div>
                      <div className="text-slate-200 bg-slate-800/80 p-2 rounded border border-slate-700/50">
                        <span className="text-amber-300">event:</span> "{log.event}"
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}