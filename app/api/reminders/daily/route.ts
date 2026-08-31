import { NextResponse } from 'next/server';
import { runDailyReminders } from '@/lib/reminders';
import { jsonError, logServerError, newCorrelationId, withCorrelationId } from '@/lib/http';

export const dynamic = 'force-dynamic';

async function run(request: Request) {
  const correlationId = newCorrelationId();
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers.get('x-cron-secret') ?? request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!secret || supplied !== secret) return jsonError('Unauthorized.', 401, correlationId);
  try {
    return withCorrelationId(NextResponse.json(await runDailyReminders()), correlationId);
  } catch (error) {
    logServerError(correlationId, error);
    return jsonError('Reminder run failed.', 500, correlationId);
  }
}

export const GET = run;
export const POST = run;
