'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { saveMilestoneResponse } from '@/lib/actions';
import { AGE_BANDS, childAgeInMonths, currentAgeBand, DOMAIN_LABELS, milestoneAgeLabel, milestoneTitleForGender, MONTHS_FROM_YEAR, sourceCheckpointForMonth } from '@/lib/demo-data';
import { getRecommendation } from '@/lib/recommendation';
import { emptyWeeklyProgress, type WeeklyProgress as WeeklyProgressData } from '@/lib/weekly-progress';
import type { ChildWithMilestones, MilestoneStatus } from '@/lib/types';
import { Bloom } from './Bloom';
import { ActivityIllustration } from './ActivityIllustration';
import { WeeklyFeed } from './WeeklyFeed';
import { WeeklyProgress } from './WeeklyProgress';

const statuses: MilestoneStatus[] = ['yes', 'almost', 'not_yet'];

function nextMilestoneAge(milestones: ChildWithMilestones['milestones'], sourceAge: number, domain: string) {
  return [...new Set(milestones.filter((item) => item.domain === domain && item.ageRangeMinMonths > sourceAge).map((item) => item.ageRangeMinMonths))].sort((a, b) => a - b)[0];
}

function adaptiveAgeFor(
  milestones: ChildWithMilestones['milestones'],
  startingAge: number,
  domain: string,
  selectedStatuses: Record<string, MilestoneStatus>,
) {
  let age = startingAge;
  for (let step = 0; step < 40; step += 1) {
    const sourceAge = age >= 12 ? sourceCheckpointForMonth(age) : age;
    const current = milestones.filter((item) => item.ageRangeMinMonths === sourceAge && item.domain === domain);
    const allReady = current.length > 0 && current.every((item) => {
      const status = selectedStatuses[item.id] ?? item.response?.status;
      return status === 'yes' || status === 'almost';
    });
    const nextAge = allReady ? nextMilestoneAge(milestones, sourceAge, domain) : undefined;
    if (!nextAge) return age;
    age = nextAge;
  }
  return age;
}

export function Checklist({ child }: { child: ChildWithMilestones }) {
  const age = childAgeInMonths(child.dob);
  const [selectedStatuses, setSelectedStatuses] = useState<Record<string, MilestoneStatus>>(
    () => Object.fromEntries(child.milestones.flatMap((item) => item.response ? [[item.id, item.response.status]] : [])),
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedDomain, setSelectedDomain] = useState('movement_physical');
  const [selectedAge, setSelectedAge] = useState<number>(() => adaptiveAgeFor(child.milestones, currentAgeBand(age), 'movement_physical', Object.fromEntries(child.milestones.flatMap((item) => item.response ? [[item.id, item.response.status]] : []))));
  const [advanceNotice, setAdvanceNotice] = useState<string | null>(null);
  const [weekProgress, setWeekProgress] = useState<WeeklyProgressData>(child.weeklyProgress ?? emptyWeeklyProgress);
  const [weekTouched, setWeekTouched] = useState<Set<string>>(new Set());
  const sourceAge = selectedAge >= 12 ? sourceCheckpointForMonth(selectedAge) : selectedAge;
  const ageOptions = [...AGE_BANDS.filter((band) => band < 12), ...MONTHS_FROM_YEAR];
  const filteredMilestones = child.milestones.filter((item) => item.ageRangeMinMonths === sourceAge && item.domain === selectedDomain);

  function changeDomain(domain: string) {
    const startingAge = selectedAge > currentAgeBand(age) ? currentAgeBand(age) : selectedAge;
    setSelectedDomain(domain);
    setSelectedAge(adaptiveAgeFor(child.milestones, startingAge, domain, selectedStatuses));
    setSelected(null);
    setAdvanceNotice(null);
  }

  function mark(milestoneId: string, status: MilestoneStatus) {
    const nextStatuses = { ...selectedStatuses, [milestoneId]: status };
    setSelectedStatuses(nextStatuses);
    setSelected(milestoneId);
    if (!weekTouched.has(milestoneId)) {
      setWeekTouched((current) => new Set(current).add(milestoneId));
      setWeekProgress((current) => ({ ...current, total: current.total + 1, yes: current.yes + (status === 'yes' ? 1 : 0), almost: current.almost + (status === 'almost' ? 1 : 0), notYet: current.notYet + (status === 'not_yet' ? 1 : 0) }));
    }
    const nextAge = adaptiveAgeFor(child.milestones, selectedAge, selectedDomain, nextStatuses);
    if (nextAge !== selectedAge) {
      setSelectedAge(nextAge);
      setSelected(null);
      setAdvanceNotice(`Your answers moved this path forward to ${nextAge} months.`);
    }
    if (child.id === 'demo') return;
    startTransition(() => { void saveMilestoneResponse({ childId: child.id, milestoneId, status }); });
  }

  return (
    <div className="content-grid">
      <div className="panel">
        <div className="panel-head">
          <div>
            <div className="checklist-title"><ActivityIllustration domain={selectedDomain} variant="compact" /><h2>Milestone checklist</h2></div>
            <p className="muted" style={{ margin: '7px 0 0', fontSize: '.82rem' }}>Choose what feels closest today. You can change it anytime.</p>
          </div>
          <span className="mono muted">{age.toFixed(1)} mo</span>
        </div>
        <div className="filter-block">
          <div className="filter-label">Age band</div>
          <div className="filter-row" role="tablist" aria-label="Milestone age bands">
            {ageOptions.map((band) => <button className={`filter-pill ${selectedAge === band ? 'active' : ''}`} key={band} type="button" role="tab" aria-selected={selectedAge === band} onClick={() => setSelectedAge(band)}>{band} mo</button>)}
          </div>
          {advanceNotice ? <div className="filter-help" aria-live="polite">{advanceNotice}</div> : selectedAge >= 12 && sourceAge !== selectedAge ? <div className="filter-help">Showing the closest guidepost: {sourceAge} months.</div> : null}
          <div className="filter-label">Domain</div>
          <div className="filter-row" role="tablist" aria-label="Milestone domains">
            {Object.entries(DOMAIN_LABELS).map(([domain, label]) => <button className={`filter-pill ${selectedDomain === domain ? 'active' : ''}`} key={domain} type="button" role="tab" aria-selected={selectedDomain === domain} onClick={() => changeDomain(domain)}>{label}</button>)}
          </div>
        </div>
        <div className="path">
          {filteredMilestones.map((milestone) => {
            const status = selectedStatuses[milestone.id];
            const recommendation = status ? getRecommendation(milestone, status, age, child.guidance) : null;
            return (
              <div className="milestone-row" key={milestone.id}>
                <span className="milestone-node"><Bloom status={status} size="small" /></span>
                <div>
                  <p className="milestone-title">{milestoneTitleForGender(milestone.title, child.gender)}</p>
                  <div className="milestone-sub">
                    <span className="mono">{milestoneAgeLabel(milestone.ageRangeMinMonths, milestone.ageRangeMaxMonths)}</span>
                  </div>
                  {recommendation && selected === milestone.id ? (
                    <div className={`recommendation ${recommendation.tone === 'reassure' ? 'reassure' : ''} ${recommendation.tone === 'mention' ? 'mention' : ''}`}>
                      <div className="rec-label">{recommendation.tone === 'celebrate' ? 'Noticed' : 'A next little step'}</div>
                      <h3>{recommendation.heading}</h3>
                      <p>{recommendation.activityText}</p>
                      <p>{recommendation.tipText}</p>
                      <Link className="source-link" href={`/child/${child.id}/milestone/${milestone.id}`} style={{ display: 'inline-block', marginTop: 12 }}>Open milestone detail ↗</Link>
                    </div>
                  ) : null}
                </div>
                <div className="status-buttons" aria-label={`Status for ${milestone.title}`}>
                  {statuses.map((option) => (
                    <button key={option} className={`status-button ${option} ${status === option ? 'active' : ''}`} type="button" onClick={() => mark(milestone.id, option)} disabled={isPending} aria-label={option === 'not_yet' ? 'Not yet' : option}>
                      {option === 'not_yet' ? 'NY' : option[0].toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {!filteredMilestones.length ? <div className="empty">No milestones found for this age and domain.</div> : null}
        <p className="legal-note">This is not a substitute for standardized developmental screening. Always share concerns with your child’s doctor.</p>
        <WeeklyProgress progress={weekProgress} />
        <WeeklyFeed child={child} statuses={selectedStatuses} />
      </div>
      <aside className="side-note">
        <div className="eyebrow" style={{ color: '#f0b429' }}>How to use this</div>
        <h2>Small observations count.</h2>
        <p>Tap Yes when you’ve seen it, Almost when it’s emerging, or Not Yet when it hasn’t happened so far.</p>
        <Link className="button" href={`/child/${child.id}/feed`}>Open weekly feed</Link>
      </aside>
    </div>
  );
}
