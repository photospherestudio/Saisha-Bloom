import Link from 'next/link';
import Image from 'next/image';
import { AppHeader } from '@/components/AppHeader';
import { WeeklyFeed } from '@/components/WeeklyFeed';
import { WeeklyProgress } from '@/components/WeeklyProgress';
import { getChild } from '@/lib/queries';
import type { MilestoneStatus } from '@/lib/types';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function WeeklyFeedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const child = await getChild(id);
  if (!child) notFound();
  const statuses = Object.fromEntries(child.milestones.flatMap((item) => item.response ? [[item.id, item.response.status]] : [])) as Record<string, MilestoneStatus>;

  return (
    <main className="page">
      <AppHeader backHref={`/child/${child.id}/checklist`} />
      <section className="shell">
        <div className="page-heading"><div><div className="eyebrow">A small plan, made for now</div><h1 className="display">This week.</h1></div><Link className="button button-primary" href={`/child/${child.id}/checklist`}>Edit checklist</Link></div>
        <div className="content-grid"><div className="panel"><WeeklyProgress progress={child.weeklyProgress} /><WeeklyFeed child={child} statuses={statuses} /></div><aside className="side-note"><div className="eyebrow" style={{ color: '#f0b429' }}>A gentle reminder</div><h2>One small try is enough.</h2><p>These ideas are prompts for play, not assignments. Follow your child’s energy and let the rest wait.</p><div className="side-note-art"><Image src="/illustrations/toddler-ramp.png" alt="" width={620} height={620} sizes="(max-width: 780px) 60vw, 260px" /></div><Link className="button" href={`/child/${child.id}/timeline`}>View timeline</Link></aside></div>
      </section>
    </main>
  );
}
