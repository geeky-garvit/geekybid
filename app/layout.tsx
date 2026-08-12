import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Header from '@/components/ui/Header';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'GeekyBid - Rare Tech & Collectibles Auctions',
  description: 'Bid on rare tech items, collectibles, and geek gear in real-time.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-slate-50/50 text-slate-900 flex flex-col`}
      >
        <Header />
        <div className="flex-1">
          {children}
        </div>
      </body>
    </html>
  );
}
