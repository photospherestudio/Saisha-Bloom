'use client';

import Link from 'next/link';
import { buildWeeklyFeed } from '@/lib/weekly-feed';
import { DOMAIN_LABELS, milestoneTitleForGender } from '@/lib/demo-data';
import type { ChildWithMilestones, MilestoneStatus } from '@/lib/types';
import { ActivityIllustration } from './ActivityIllustration';

export function WeeklyFeed({ child, statuses = {} }: { child: ChildWithMilestones; statuses?: Record<string, MilestoneStatus> }) {
  const items = buildWeeklyFeed(child.milestones, (Date.now() - new Date(child.dob).getTime()) / (1000 * 60 * 60 * 24 * 30.4375), statuses, child.guidance);
  return (
    <section className="feed-panel">
      <div className="eyebrow">Personalized for this week</div>
      <div className="panel-head"><div><h2>What to try this week</h2><p className="muted">A few playful ideas shaped by what you’ve noticed.</p></div></div>
      <div className="feed-list">
        {items.map(({ milestone, status, recommendation, reason }) => {
          return <article className="feed-item" key={milestone.id}>
            <div className="feed-item-top"><span className="feed-reason">{reason}</span><span className={`feed-status ${status}`}>{status === 'not_yet' ? 'Not yet' : status === 'almost' ? 'Almost' : 'Yes'}</span></div>
            <div className="feed-item-body">
              <div>
                <h3>{milestoneTitleForGender(milestone.title, child.gender)}</h3>
                <div className="milestone-sub"><span>{DOMAIN_LABELS[milestone.domain as keyof typeof DOMAIN_LABELS] ?? milestone.domain}</span></div>
                <p>{recommendation.activityText}</p>
                <p className="muted">{recommendation.tipText}</p>
                <Link className="source-link" href={`/child/${child.id}/milestone/${milestone.id}`}>Open guidepost ↗</Link>
              </div>
              <ActivityIllustration domain={milestone.domain} title={milestone.title} />
            </div>
          </article>
        })}
      </div>
    </section>
  );
}
