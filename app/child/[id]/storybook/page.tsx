import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { StorybookExport } from '@/components/StorybookExport';
import { getChild, getTimelineObservations } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function StorybookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const child = await getChild(id);
  if (!child || child.relationship !== 'owner') notFound();
  const observations = await getTimelineObservations(id);
  return <main className="page"><AppHeader backHref={`/child/${id}/timeline`} /><section className="shell"><div className="page-heading"><div><div className="eyebrow">A private keepsake</div><h1 className="display">{child.name}’s storybook.</h1></div><Link className="button button-secondary" href={`/child/${id}/timeline`}>Back to timeline</Link></div><div className="panel detail-card"><p className="muted">Choose up to 24 moments from the last year. The PDF stays private and is generated only after your current password is confirmed.</p><StorybookExport childId={id} observations={observations.map((item) => ({ id: item.id, title: item.milestone.title, date: item.createdAt }))} /><p className="legal-note">This is not a substitute for standardized developmental screening. Always share concerns with your child’s doctor.</p></div></section></main>;
}
