import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { Bloom } from '@/components/Bloom';
import { milestoneAgeLabel, milestoneTitleForGender } from '@/lib/demo-data';
import { getChild, progressFor } from '@/lib/queries';
import { WeeklyFeed } from '@/components/WeeklyFeed';
import { GrowthReference } from '@/components/GrowthReference';
import { ChildSwitcher } from '@/components/ChildSwitcher';
import { FamilyControls } from '@/components/FamilyControls';
import { ageDisplay, asFamilyChild } from '@/components/saisha-ui';
import { notFound } from 'next/navigation';
import { GrowthTracker } from '@/components/GrowthTracker';
import { getGrowthMeasurements } from '@/lib/growth';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ searchParams }: { searchParams?: Promise<{ childId?: string }> }) {
  const childId = (await searchParams)?.childId;
  const child = await getChild(childId);
  if (!child) {
    return <main className="page"><AppHeader /><section className="shell form-wrap"><div className="eyebrow">Your family space</div><h1 className="display">Make some room.</h1><p className="form-intro">Create your first child profile to begin noticing the small things.</p><Link className="button button-primary" href="/onboarding">Create a child profile</Link></section></main>;
  }
  const [growthMeasurements] = await Promise.all([getGrowthMeasurements(child.id)]);
  const familyChild = asFamilyChild(child);
  const progress = progressFor(child);
  const { chronological, corrected, adjusted } = ageDisplay(familyChild);
  return (
    <main className="page">
      <AppHeader />
      <section className="shell">
        <div className="page-heading"><div><div className="eyebrow">Your family space</div><h1 className="display">Good morning.</h1></div><Link className="button button-primary" href={`/child/${child.id}/checklist`}>Continue the path</Link></div>
        <div className="content-grid">
          <div className="panel">
            <div className="panel-head"><ChildSwitcher active={{ id: child.id, name: child.name, dob: child.dob }} initialChildren={familyChild.accessibleChildren} /><div className="age-stack"><span className="mono muted">{adjusted ? `${corrected.toFixed(1)} mo adjusted` : `${chronological.toFixed(1)} mo`}</span><span className="muted">{adjusted ? `${chronological.toFixed(1)} mo chronological` : 'Chronological age'}</span></div></div>
            <h2>This month’s path</h2>
            <p className="muted" style={{ lineHeight: 1.55 }}>All domains · age bands from 2 months to 4 years</p>
            <div style={{ margin: '25px 0 24px' }}><div className="progress-track"><div className="progress-fill" style={{ width: `${progress.total ? (progress.yes / progress.total) * 100 : 0}%` }} /></div><div className="progress-meta"><span>{progress.yes} noticed</span><span>{progress.total} in this view</span></div></div>
            <div className="path">{child.milestones.slice(0, 6).map((milestone) => <div className="milestone-row" key={milestone.id}><span className="milestone-node"><Bloom status={milestone.response?.status} size="small" /></span><div><p className="milestone-title">{milestoneTitleForGender(milestone.title, child.gender)}</p><div className="milestone-sub"><span className="mono">{milestoneAgeLabel(milestone.ageRangeMinMonths, milestone.ageRangeMaxMonths)}</span></div></div><Bloom status={milestone.response?.status} /></div>)}</div>
          </div>
          <aside className="side-note"><div className="eyebrow" style={{ color: '#f0b429' }}>A note for you</div><h2>Growth is not a race.</h2><p>Milestones are guideposts, not deadlines. Use this space to notice, play, and bring useful questions to your child’s care team.</p><Link className="button" href={`/child/${child.id}/feed`}>View weekly feed</Link></aside>
        </div>
        <div className="utility-actions">{child.id !== 'demo' ? <a className="button button-secondary" href={`/api/children/${child.id}/visit-summary`}>Prepare pediatrician summary</a> : null}<Link className="button button-secondary" href={`/child/${child.id}/timeline`}>Open full timeline</Link></div>
        {child.id !== 'demo' ? <FamilyControls childId={child.id} preference={familyChild.reminderPreference} relationship={familyChild.relationship} members={familyChild.familyMembers} pendingInvites={familyChild.pendingInvites} /> : null}
        <GrowthReference ageInMonths={chronological} heightCm={child.heightCm} weightKg={child.weightKg} />
        {child.id !== 'demo' ? <GrowthTracker childId={child.id} relationship={familyChild.relationship} measurements={growthMeasurements} legacyHeightCm={child.heightCm} legacyWeightKg={child.weightKg} /> : null}
        <WeeklyFeed child={child} />
      </section>
    </main>
  );
}
