// src/app/layout.tsx
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import Navbar from '@/app/components/Navbar';

export const metadata = {
  title: 'Auction Marketplace',
  description: 'Bid, buy, and sell items on the premier real-time auction platform.',
};

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal?: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="bg-slate-50 text-slate-900 font-sans antialiased min-h-full flex flex-col">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            {modal}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}