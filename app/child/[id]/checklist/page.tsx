import { AppHeader } from '@/components/AppHeader';
import { Checklist } from '@/components/Checklist';
import { getChild } from '@/lib/queries';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const child = await getChild(id);
  if (!child) notFound();
  return <main className="page"><AppHeader backHref="/dashboard" /><section className="shell"><div className="page-heading"><div><div className="eyebrow">{child.name}’s growing story</div><h1 className="display">The movement path.</h1></div></div><Checklist child={child} /></section></main>;
}
