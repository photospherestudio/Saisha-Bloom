import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Saisha Bloom — a gentler way to notice growth',
  description: 'A calm milestone tracker for growing families.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
