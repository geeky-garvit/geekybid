'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '@/lib/validation';
import { z } from 'zod';

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resData = await res.json();

      if (!res.ok || !resData.success) {
        throw new Error(resData.message || resData.error || 'Failed to create account.');
      }

      // Redirect user to marketplace or home page
      router.push('/auctions');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Create an account</h2>
          <p className="mt-2 text-sm text-slate-500">
            Join GeekyBid to place bids and host auctions.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold rounded-2xl flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Full Name
            </label>
            <input
              type="text"
              {...register('name')}
              className={`w-full px-4 py-3 rounded-xl border text-slate-900 font-medium text-sm transition focus:outline-none focus:ring-2 ${
                errors.name
                  ? 'border-rose-500 focus:ring-rose-200'
                  : 'border-slate-200 focus:ring-purple-600'
              }`}
              placeholder="Garvit Chawla"
            />
            {errors.name && (
              <p className="mt-1.5 text-xs font-semibold text-rose-600">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Email
            </label>
            <input
              type="email"
              {...register('email')}
              className={`w-full px-4 py-3 rounded-xl border text-slate-900 font-medium text-sm transition focus:outline-none focus:ring-2 ${
                errors.email
                  ? 'border-rose-500 focus:ring-rose-200'
                  : 'border-slate-200 focus:ring-purple-600'
              }`}
              placeholder="garvit@example.com"
            />
            {errors.email && (
              <p className="mt-1.5 text-xs font-semibold text-rose-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Password
            </label>
            <input
              type="password"
              {...register('password')}
              className={`w-full px-4 py-3 rounded-xl border text-slate-900 font-medium text-sm transition focus:outline-none focus:ring-2 ${
                errors.password
                  ? 'border-rose-500 focus:ring-rose-200'
                  : 'border-slate-200 focus:ring-purple-600'
              }`}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1.5 text-xs font-semibold text-rose-600">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-200 transition duration-150 flex justify-center items-center"
          >
            {isSubmitting ? (
              <span className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-purple-700 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}