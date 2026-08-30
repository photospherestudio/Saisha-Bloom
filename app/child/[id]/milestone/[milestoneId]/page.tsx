import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { Bloom } from '@/components/Bloom';
import { activityIllustrationSrc } from '@/components/ActivityIllustration';
import { DOMAIN_LABELS, childAgeInMonths, milestoneAgeLabel, milestoneTitleForGender } from '@/lib/demo-data';
import { activityDetailsFor } from '@/lib/activity-bank';
import { getRecommendation } from '@/lib/recommendation';
import { getChild } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function MilestoneDetailPage({ params }: { params: Promise<{ id: string; milestoneId: string }> }) {
  const { id, milestoneId } = await params;
  const child = await getChild(id);
  const milestone = child.milestones.find((item) => item.id === milestoneId);
  if (!milestone) notFound();
  const age = childAgeInMonths(child.dob);
  const status = milestone.response?.status ?? 'not_yet';
  const recommendation = getRecommendation(milestone, status, age, child.guidance);
  const activity = activityDetailsFor(milestone, age);
  const domainLabel = DOMAIN_LABELS[milestone.domain as keyof typeof DOMAIN_LABELS] ?? milestone.domain;

  return (
    <main className="page">
      <AppHeader backHref={`/child/${child.id}/checklist`} />
      <section className="shell">
        <div className="detail-layout">
          <div className="detail-card">
          <div className="eyebrow">A closer look</div>
          <div className="detail-meta"><Bloom status={milestone.response?.status} size="large" /><span className="mono muted">{milestoneAgeLabel(milestone.ageRangeMinMonths, milestone.ageRangeMaxMonths)}</span><span className="detail-domain">{domainLabel}</span></div>
          <h1 className="display">{milestoneTitleForGender(milestone.title, child.gender)}</h1>
          <p className="detail-copy">Every child’s path has its own rhythm. This guidepost is here to help you notice what is unfolding and find a playful next step.</p>
          <div className={`recommendation ${recommendation.tone === 'reassure' ? 'reassure' : ''} ${recommendation.tone === 'mention' ? 'mention' : ''}`}>
            <div className="rec-label">{recommendation.tone === 'celebrate' ? 'Noticed' : 'A next little step'}</div>
            <h3>{recommendation.heading}</h3><p>{recommendation.tipText}</p>
          </div>
          <section className="activity-detail-content" aria-labelledby="activity-detail-heading">
            <div className="eyebrow">Try it together</div>
            <h2 id="activity-detail-heading">{activity.activityTitle}</h2>
            <p>{activity.activityText}</p>
            <p className="detail-copy">{activity.tipText}</p>
            <div className="activity-fact-grid">
              <div className="activity-fact"><h3>Frequency</h3><p>{activity.frequency}</p></div>
              <div className="activity-fact"><h3>Benefits</h3><ul>{activity.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul></div>
              <div className="activity-fact"><h3>Materials required</h3><ul>{activity.materials.map((material) => <li key={material}>{material}</li>)}</ul></div>
            </div>
          </section>
          <Link className="button button-primary" href={`/child/${child.id}/checklist`} style={{ marginTop: 25 }}>Back to checklist</Link>
          </div>
          <div className="detail-illustration"><Image src={activityIllustrationSrc(milestone.title, milestone.domain)} alt="" width={700} height={700} sizes="(max-width: 780px) 70vw, 380px" /></div>
        </div>
        <p className="legal-note">This is not a substitute for standardized developmental screening. Always share concerns with your child’s doctor.</p>
      </section>
    </main>
  );
}
