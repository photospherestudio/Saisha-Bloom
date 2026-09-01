import type { Metadata } from 'next';
import './globals.css';
import { PublicServiceWorker } from '@/components/PublicServiceWorker';
import { PrivacyAnalytics } from '@/components/PrivacyAnalytics';

export const metadata: Metadata = {
  title: 'Saisha Bloom — a gentler way to notice growth',
  description: 'A calm milestone tracker for growing families.',
  applicationName: 'Saisha Bloom',
  appleWebApp: { capable: true, title: 'Saisha Bloom', statusBarStyle: 'default' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><PublicServiceWorker /><PrivacyAnalytics />{children}</body>
    </html>
  );
}
