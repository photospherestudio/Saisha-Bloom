import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { hasClerkConfig } from '@/lib/auth';
import './globals.css';

export const metadata: Metadata = {
  title: 'Saisha Bloom — a gentler way to notice growth',
  description: 'A calm milestone tracker for growing families.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{hasClerkConfig() ? <ClerkProvider>{children}</ClerkProvider> : children}</body>
    </html>
  );
}
