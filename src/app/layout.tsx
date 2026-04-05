import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { NavLinks } from '@/components/NavLinks';
import { SearchBar } from '@/components/SearchBar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Polymarket',
  description: 'Prediction markets for real-world events',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <header className="sticky top-0 z-50 border-b border-pm-border bg-pm-bg/95 backdrop-blur-sm">
              <nav className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3 sm:gap-4">
                <a href="/" className="flex items-center gap-2 font-bold text-lg text-white shrink-0">
                  <span className="text-pm-blue text-2xl leading-none" style={{ transform: 'translateY(-2px)', display: 'inline-block' }}>⬡</span>
                  <span className="hidden sm:inline">Polymarket</span>
                </a>
                <NavLinks />
                <div className="hidden md:block flex-1">
                  <SearchBar />
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
                  <button className="text-sm text-pm-muted hover:text-pm-text transition-colors cursor-pointer">
                    Log in
                  </button>
                  <button className="text-sm bg-pm-blue hover:bg-pm-blue/90 text-white px-3 sm:px-4 py-1.5 rounded-lg font-medium transition-colors cursor-pointer">
                    Sign up
                  </button>
                </div>
              </nav>
              <div className="md:hidden px-4 pb-2">
                <SearchBar />
              </div>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="border-t border-pm-border py-6 text-center text-pm-muted text-sm">
              © 2025 Polymarket Clone
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
