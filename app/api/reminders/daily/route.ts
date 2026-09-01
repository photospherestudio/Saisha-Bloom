import { NextResponse } from 'next/server';
import { runDailyReminders } from '@/lib/reminders';
import { purgeExpiredObservationUploads } from '@/lib/observation-actions';
import { expireAnonymousEntries, retryPendingAccountDeletions } from '@/lib/account-actions';
import { jsonError, logServerError, newCorrelationId, withCorrelationId } from '@/lib/http';

export const dynamic = 'force-dynamic';

async function run(request: Request) {
  const correlationId = newCorrelationId();
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers.get('x-cron-secret') ?? request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!secret || supplied !== secret) return jsonError('Unauthorized.', 401, correlationId);
  try {
    const [reminders, expiredUploads, pendingDeletions, expiredAnonymous] = await Promise.all([runDailyReminders(), purgeExpiredObservationUploads(), retryPendingAccountDeletions(), expireAnonymousEntries()]);
    return withCorrelationId(NextResponse.json({ reminders, cleanup: { expiredUploads, pendingDeletions, expiredAnonymous } }), correlationId);
  } catch (error) {
    logServerError(correlationId, error);
    return jsonError('Reminder run failed.', 500, correlationId);
  }
}

export const GET = run;
export const POST = run;
