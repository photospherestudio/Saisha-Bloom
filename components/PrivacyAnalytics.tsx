'use client';

import { Analytics } from '@vercel/analytics/next';
import { usePathname } from 'next/navigation';

const PRIVATE_PATHS = ['/dashboard', '/child/', '/account', '/api/', '/onboarding', '/invite', '/consent', '/sign-in', '/sign-up', '/forgot-password', '/auth/'];

export function PrivacyAnalytics() {
  const pathname = usePathname();
  if (process.env.NEXT_PUBLIC_PRIVACY_COPY_APPROVED !== 'true' || PRIVATE_PATHS.some((path) => pathname === path || pathname.startsWith(path))) return null;
  return <Analytics beforeSend={(event) => {
    const url = new URL(event.url, window.location.origin);
    if (PRIVATE_PATHS.some((path) => url.pathname === path || url.pathname.startsWith(path))) return null;
    return { ...event, url: url.pathname };
  }} />;
}
