import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/Navigation';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: 'Come Back Gym',
  description: 'Tracker de treinos do Jean — Dublin, Irlanda',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-50 antialiased">
        <main className="flex-1 pb-20 max-w-2xl mx-auto w-full px-4 pt-6">
          {children}
        </main>
        <Navigation />
      </body>
    </html>
  );
}
