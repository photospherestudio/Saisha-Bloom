import { NextResponse } from 'next/server';
import { ChildAccessError } from '@/lib/queries';
import { createVisitSummaryPdf, getVisitSummary } from '@/lib/visit-summary';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const summary = await getVisitSummary(id);
    const pdf = await createVisitSummaryPdf(summary);
    return new NextResponse(Buffer.from(pdf), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${summary.child.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'child'}-visit-summary.pdf"`, 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof ChildAccessError) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    return NextResponse.json({ error: 'Summary could not be generated.' }, { status: 500 });
  }
}
