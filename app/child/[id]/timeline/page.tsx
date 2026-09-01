import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { milestoneTitleForGender } from '@/lib/demo-data';
import { getChild, getTimelineObservations } from '@/lib/queries';
import { getCurrentAppUser } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { ageDisplay, asFamilyChild, statusLabel } from '@/components/saisha-ui';
import { TimelineObservationControls } from '@/components/TimelineObservationControls';

export const dynamic = 'force-dynamic';

export default async function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const child = await getChild(id);
  if (!child) notFound();
  const familyChild = asFamilyChild(child);
  const timeline = id === 'demo' ? [] : await getTimelineObservations(id);
  const viewer = id === 'demo' ? null : await getCurrentAppUser();
  const events = timeline.map((item) => ({ ...item, milestoneId: item.milestone.id })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const { corrected, chronological, adjusted } = ageDisplay(familyChild);
  const byMilestone = new Map(child.milestones.map((item) => [item.id, item]));

  return (
    <main className="page">
      <AppHeader backHref={`/child/${child.id}/checklist`} />
      <section className="shell">
        <div className="page-heading">
          <div><div className="eyebrow">A record of the small things</div><h1 className="display">Your timeline.</h1></div>
          <Link className="button button-primary" href={`/child/${child.id}/checklist`}>Back to path</Link>
        </div>
        <div className="panel detail-card">
          <div className="panel-head"><div><h2>{child.name}’s progress</h2><p className="muted">{events.length} observation{events.length === 1 ? '' : 's'} recorded · {adjusted ? `${corrected.toFixed(1)} mo adjusted · ${chronological.toFixed(1)} mo chronological` : `${chronological.toFixed(1)} mo chronological`}</p></div>{child.id !== 'demo' ? <a className="button button-secondary" href={`/api/children/${child.id}/visit-summary`}>Export summary</a> : null}</div>
          {events.length ? (
            <div className="timeline-list">
              {events.map((event, index) => {
                const milestone = byMilestone.get(event.milestoneId);
                if (!milestone) return null;
                return <div className="timeline-item" key={event.id ?? `${event.milestoneId}-${event.createdAt}-${index}`}>
                  <div className="timeline-date mono">{new Date(event.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</div>
                  <div><p className="milestone-title">{milestoneTitleForGender(milestone.title, child.gender)}</p><div className="milestone-sub"><span>{statusLabel(event.status)}</span>{event.author?.name || event.author?.email ? <span>by {event.author.id === viewer?.id ? 'you' : event.author.name ?? event.author.email}</span> : <span>Anonymous family entry</span>}{event.updatedAt && event.updatedAt !== event.createdAt ? <span>edited</span> : null}</div>{event.note ? <p className="timeline-note">{event.note}</p> : null}{event.media?.length ? <div className="timeline-media">{event.media.map((item) => item.signedUrl ? <img src={item.signedUrl} alt="Saved family memory" key={item.id} /> : null)}</div> : null}<TimelineObservationControls responseId={event.id} status={event.status} note={event.note} media={event.media ?? []} canManage={Boolean(event.canManage)} anonymous={Boolean(event.anonymous)} /></div>
                </div>
              })}
            </div>
          ) : <div className="empty">Your timeline will fill with the moments you choose to notice. <Link className="source-link" href={`/child/${child.id}/checklist`}>Start with the path ↗</Link></div>}
          {child.relationship === 'owner' ? <Link className="button button-secondary" href={`/child/${child.id}/storybook`}>Make a milestone storybook</Link> : null}<p className="legal-note">This is not a substitute for standardized developmental screening. Always share concerns with your child’s doctor.</p>
        </div>
      </section>
    </main>
  );
}
