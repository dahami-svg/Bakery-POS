import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { TenantProvider } from '@/context/TenantContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: 'Universal POS & Logistics Manager',
  description: 'Premium multi-tenant analytics, point of sale, kitchen display system, and inventory tracking.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full bg-surface text-on-surface font-sans antialiased overflow-hidden">
        <TenantProvider>
          <div className="flex bg-surface h-screen w-full overflow-hidden">
            <Sidebar />
            <main className="flex-1 min-w-0 h-full">
              {children}
            </main>
          </div>
        </TenantProvider>
      </body>
    </html>
  );
}
