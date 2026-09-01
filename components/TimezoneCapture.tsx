'use client';

import { useEffect } from 'react';
import { captureViewerTimezone } from '@/lib/timezone-actions';

export function TimezoneCapture() {
  useEffect(() => { const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; if (timeZone) void captureViewerTimezone(timeZone); }, []);
  return null;
}
