import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/layout/Navbar';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GeekyBid - Real-Time Tech & Collectibles Auction Platform',
  description: 'Bid on rare tech, retro hardware, and collectibles in real-time.',
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50/50 text-slate-900 antialiased min-h-screen flex flex-col`}>
        <Navbar />
        <div className="flex-1">{children}</div>
        {modal}
      </body>
    </html>
  );
}
