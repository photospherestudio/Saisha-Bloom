'use client';

import { Analytics } from '@vercel/analytics/next';
import { track } from '@vercel/analytics';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { publicAnalyticsSurface } from '@/lib/public-analytics';

const PRIVATE_PATHS = ['/dashboard', '/child/', '/account', '/api/', '/onboarding', '/invite', '/consent', '/sign-in', '/sign-up', '/forgot-password', '/auth/'];
const PUBLIC_DEMO = '/child/demo/checklist';

function isPrivatePath(pathname: string) {
  return pathname !== PUBLIC_DEMO && PRIVATE_PATHS.some((path) => pathname === path || pathname.startsWith(path));
}

export function PrivacyAnalytics() {
  const pathname = usePathname();
  const analyticsApproved = process.env.NEXT_PUBLIC_PRIVACY_COPY_APPROVED === 'true';
  const eventsEnabled = process.env.NEXT_PUBLIC_ANALYTICS_EVENTS_ENABLED === 'true';
  const surface = publicAnalyticsSurface(pathname);
  useEffect(() => {
    if (analyticsApproved && eventsEnabled && surface) track('public_surface_viewed', { surface });
  }, [analyticsApproved, eventsEnabled, surface]);
  if (!analyticsApproved || isPrivatePath(pathname)) return null;
  return <Analytics beforeSend={(event) => {
    const url = new URL(event.url, window.location.origin);
    if (isPrivatePath(url.pathname)) return null;
    return { ...event, url: url.pathname };
  }} />;
}
