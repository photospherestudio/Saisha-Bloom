import { NextResponse } from 'next/server';
import { listAccessibleChildren } from '@/lib/queries';
import { jsonError, logServerError, newCorrelationId, withCorrelationId } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  const correlationId = newCorrelationId();
  try {
    const children = await listAccessibleChildren();
    return withCorrelationId(NextResponse.json({ children }, { headers: { 'Cache-Control': 'private, no-store' } }), correlationId);
  } catch (error) {
    logServerError(correlationId, error);
    return jsonError('Children could not be loaded.', 500, correlationId);
  }
}
