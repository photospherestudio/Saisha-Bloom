import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { milestoneTitleForGender } from '@/lib/demo-data';
import { getChild } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const child = await getChild(id);
  const answered = child.milestones.filter((item) => item.response);

  return (
    <main className="page">
      <AppHeader backHref={`/child/${child.id}/checklist`} />
      <section className="shell">
        <div className="page-heading">
          <div><div className="eyebrow">A record of the small things</div><h1 className="display">Your timeline.</h1></div>
          <Link className="button button-primary" href={`/child/${child.id}/checklist`}>Back to path</Link>
        </div>
        <div className="panel detail-card">
          <div className="panel-head"><div><h2>{child.name}’s progress</h2><p className="muted">{answered.length} milestone{answered.length === 1 ? '' : 's'} noted so far</p></div></div>
          {answered.length ? (
            <div className="timeline-list">
              {answered.map((item) => (
                <div className="timeline-item" key={item.id}>
                  <div className="timeline-date mono">{new Date(item.response!.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</div>
                  <div><p className="milestone-title">{milestoneTitleForGender(item.title, child.gender)}</p><div className="milestone-sub"><span>{item.response!.status === 'yes' ? 'Yes' : item.response!.status === 'almost' ? 'Almost' : 'Not yet'}</span></div></div>
                </div>
              ))}
            </div>
          ) : <div className="empty">Your timeline will fill with the moments you choose to notice. <Link className="source-link" href={`/child/${child.id}/checklist`}>Start with the path ↗</Link></div>}
          <p className="legal-note">This is not a substitute for standardized developmental screening. Always share concerns with your child’s doctor.</p>
        </div>
      </section>
    </main>
  );
}
