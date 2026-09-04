import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/auth-provider';
import { CartProvider } from '@/components/providers/cart-context';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/cart/cart-drawer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LUXEHOME | Luxury Beds, Mattresses & Bespoke Furniture',
  description: 'Shop luxury handcrafted upholstered bed frames, orthopedic mattresses, and bespoke furniture with nationwide delivery.',
  openGraph: {
    title: 'LUXEHOME | Luxury Beds & Bespoke Furniture',
    description: 'Shop luxury handcrafted upholstered bed frames, orthopedic mattresses, and bespoke furniture.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased min-h-screen flex flex-col`}>
        <AuthProvider>
          <CartProvider>
            <Header />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <Footer />
            <CartDrawer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
