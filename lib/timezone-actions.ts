'use server';

import { db } from './db';
import { getCurrentAppUser } from './auth';

export async function captureViewerTimezone(timeZone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format();
  } catch { return { ok: false as const }; }
  const user = await getCurrentAppUser();
  if (!user) return { ok: false as const };
  if (user.timezone !== timeZone) await db.user.update({ where: { id: user.id }, data: { timezone: timeZone } });
  return { ok: true as const };
}
