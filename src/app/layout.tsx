import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { LayoutProvider } from '@/context/LayoutContext';
import { TenantProvider } from '@/context/TenantContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppShell } from '@/components/AppShell';

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
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="h-full bg-surface text-on-surface font-sans antialiased overflow-hidden">
        <AuthProvider>
          <ThemeProvider>
            <TenantProvider>
              <LayoutProvider>
                <AppShell>{children}</AppShell>
              </LayoutProvider>
            </TenantProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
