/**
 * Root Layout
 * @author Matteo Owona, Rouchda Yampen
 */

import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import './globals.css';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '700', '900'],
  variable: '--font-roboto',
  display: 'swap',
});
import { QueryProvider } from '@/lib/providers/query-provider';
import { SessionProvider } from '@/lib/providers/session-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { GeolocationBootstrap } from '@/components/providers/geolocation-bootstrap';

export const metadata: Metadata = {
  title: 'Yowyob - Moteur de Recherche Local',
  description: 'Trouvez des produits, services et commerces près de chez vous',
  icons: {
    icon: '/logo.jpg',
    shortcut: '/logo.jpg',
    apple: '/logo.jpg',
  },
};

import { Footer } from '@/components/layout/footer';
import { Sidebar } from '@/components/layout/sidebar';
import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${roboto.variable} font-sans antialiased`}>
        <SessionProvider>
          <ThemeProvider>
            <QueryProvider>
              <GeolocationBootstrap>
                {children}
                <Sidebar />
                <Footer />
                <Toaster position="top-right" richColors closeButton />
              </GeolocationBootstrap>
            </QueryProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}