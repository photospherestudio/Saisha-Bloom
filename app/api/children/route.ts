import { NextResponse } from 'next/server';
import { listAccessibleChildren } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  const children = await listAccessibleChildren();
  return NextResponse.json({ children }, { headers: { 'Cache-Control': 'private, no-store' } });
}
