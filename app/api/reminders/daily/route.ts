import { NextResponse } from 'next/server';
import { runDailyReminders } from '@/lib/reminders';

export const dynamic = 'force-dynamic';

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers.get('x-cron-secret') ?? request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!secret || supplied !== secret) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    return NextResponse.json(await runDailyReminders());
  } catch {
    return NextResponse.json({ error: 'Reminder run failed.' }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
