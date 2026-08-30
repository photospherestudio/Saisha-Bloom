import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { Bloom } from '@/components/Bloom';
import { childAgeInMonths, milestoneAgeLabel, milestoneTitleForGender } from '@/lib/demo-data';
import { getChild, progressFor } from '@/lib/queries';
import { WeeklyFeed } from '@/components/WeeklyFeed';
import { GrowthReference } from '@/components/GrowthReference';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const child = await getChild();
  const progress = progressFor(child);
  const age = childAgeInMonths(child.dob);
  return (
    <main className="page">
      <AppHeader />
      <section className="shell">
        <div className="page-heading"><div><div className="eyebrow">Your family space</div><h1 className="display">Good morning.</h1></div><Link className="button button-primary" href={`/child/${child.id}/checklist`}>Continue the path</Link></div>
        <div className="content-grid">
          <div className="panel">
            <div className="panel-head"><div className="profile-chip"><span className="profile-chip-mark">{child.name[0]?.toUpperCase()}</span>{child.name}</div><span className="mono muted">{age.toFixed(1)} mo</span></div>
            <h2>This month’s path</h2>
            <p className="muted" style={{ lineHeight: 1.55 }}>All domains · age bands from 2 months to 4 years</p>
            <div style={{ margin: '25px 0 24px' }}><div className="progress-track"><div className="progress-fill" style={{ width: `${progress.total ? (progress.yes / progress.total) * 100 : 0}%` }} /></div><div className="progress-meta"><span>{progress.yes} noticed</span><span>{progress.total} in this view</span></div></div>
            <div className="path">{child.milestones.slice(0, 6).map((milestone) => <div className="milestone-row" key={milestone.id}><span className="milestone-node"><Bloom status={milestone.response?.status} size="small" /></span><div><p className="milestone-title">{milestoneTitleForGender(milestone.title, child.gender)}</p><div className="milestone-sub"><span className="mono">{milestoneAgeLabel(milestone.ageRangeMinMonths, milestone.ageRangeMaxMonths)}</span></div></div><Bloom status={milestone.response?.status} /></div>)}</div>
          </div>
          <aside className="side-note"><div className="eyebrow" style={{ color: '#f0b429' }}>A note for you</div><h2>Growth is not a race.</h2><p>Milestones are guideposts, not deadlines. Use this space to notice, play, and bring useful questions to your child’s care team.</p><Link className="button" href={`/child/${child.id}/feed`}>View weekly feed</Link></aside>
        </div>
        <GrowthReference ageInMonths={age} heightCm={child.heightCm} weightKg={child.weightKg} />
        <WeeklyFeed child={child} />
      </section>
    </main>
  );
}
