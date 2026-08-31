import { NextResponse } from 'next/server';
import { ChildAccessError } from '@/lib/queries';
import { createVisitSummaryPdf, getVisitSummary } from '@/lib/visit-summary';
import { jsonError, logServerError, newCorrelationId, withCorrelationId } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const correlationId = newCorrelationId();
  try {
    const { id } = await params;
    const summary = await getVisitSummary(id);
    const pdf = await createVisitSummaryPdf(summary);
    return withCorrelationId(new NextResponse(Buffer.from(pdf), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${summary.child.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'child'}-visit-summary.pdf"`, 'Cache-Control': 'private, no-store' } }), correlationId);
  } catch (error) {
    if (error instanceof ChildAccessError) return jsonError('Not found.', 404, correlationId);
    logServerError(correlationId, error);
    return jsonError('Summary could not be generated.', 500, correlationId);
  }
}
