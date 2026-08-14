// src/app/layout.tsx
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/app/components/Navbar';

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal?: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 font-sans antialiased">
        <AuthProvider>
          <Navbar />
          {children}
          {modal}
        </AuthProvider>
      </body>
    </html>
  );
}