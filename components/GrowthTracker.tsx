'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addGrowthMeasurement, type GrowthPoint } from '@/lib/growth';

function dateLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
}

function Trend({ label, unit, values }: { label: string; unit: string; values: Array<{ date: string; value: number }> }) {
  if (values.length < 2) return null;
  const min = Math.min(...values.map((point) => point.value));
  const max = Math.max(...values.map((point) => point.value));
  const span = max - min || 1;
  const points = values.map((point, index) => `${12 + (index * 216) / (values.length - 1)},${74 - ((point.value - min) / span) * 54}`).join(' ');
  return <section className="growth-trend" aria-label={`${label} trend from ${min.toFixed(1)} to ${max.toFixed(1)} ${unit}`}><div><strong>{label} trend</strong><span>{values.length} dated entries</span></div><svg viewBox="0 0 240 86" role="img" aria-label={`${label} line trend`}><path d="M12 74H228" stroke="#dbe4d8" strokeWidth="2" /><polyline fill="none" points={points} stroke="#35513e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />{values.map((point, index) => { const x = 12 + (index * 216) / (values.length - 1); const y = 74 - ((point.value - min) / span) * 54; return <circle key={`${point.date}-${point.value}`} cx={x} cy={y} r="4.5" fill="#c1587a"><title>{`${dateLabel(point.date)}: ${point.value.toFixed(1)} ${unit}`}</title></circle>; })}</svg><small>{min.toFixed(1)}–{max.toFixed(1)} {unit} across these entries</small></section>;
}

export function GrowthTracker({ childId, relationship, measurements, legacyHeightCm, legacyWeightKg }: { childId: string; relationship: 'owner' | 'editor'; measurements: GrowthPoint[]; legacyHeightCm?: number | null; legacyWeightKg?: number | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const height = measurements.flatMap((point) => point.heightCm === null ? [] : [{ date: point.measuredAt, value: point.heightCm }]);
  const weight = measurements.flatMap((point) => point.weightKg === null ? [] : [{ date: point.measuredAt, value: point.weightKg }]);
  const maxDate = new Date().toISOString().slice(0, 10);

  function submit(formData: FormData) {
    startTransition(async () => {
      setMessage('');
      const result = await addGrowthMeasurement({ childId, measuredAt: String(formData.get('measuredAt') ?? ''), heightCm: String(formData.get('heightCm') ?? ''), weightKg: String(formData.get('weightKg') ?? '') });
      if (!result.ok) return setMessage(result.error);
      setMessage('Saved.');
      router.refresh();
    });
  }

  return <section className="panel growth-tracker"><div className="eyebrow">Longitudinal growth</div><div className="panel-head"><div><h2>Measurements over time</h2><p className="muted">A simple record, not a percentile or diagnosis.</p></div></div>{measurements.length ? <div className="growth-measurements">{measurements.map((point) => <div key={point.id}><strong>{dateLabel(point.measuredAt)}</strong><span>{point.heightCm !== null ? `${point.heightCm.toFixed(1)} cm` : null}{point.heightCm !== null && point.weightKg !== null ? ' · ' : null}{point.weightKg !== null ? `${point.weightKg.toFixed(1)} kg` : null}</span></div>)}</div> : <p className="muted">Add a dated height or weight when it is useful to your family.</p>}<div className="growth-trends"><Trend label="Height" unit="cm" values={height} /><Trend label="Weight" unit="kg" values={weight} /></div>{legacyHeightCm || legacyWeightKg ? <p className="legal-note">Earlier onboarding entry{legacyHeightCm && legacyWeightKg ? 'ies' : 'y'} {legacyHeightCm ? `${legacyHeightCm.toFixed(1)} cm` : ''}{legacyHeightCm && legacyWeightKg ? ' and ' : ''}{legacyWeightKg ? `${legacyWeightKg.toFixed(1)} kg` : ''} ha{legacyHeightCm && legacyWeightKg ? 've' : 's'} no measurement date, so {legacyHeightCm && legacyWeightKg ? 'they are' : 'it is'} not plotted.</p> : null}{relationship === 'owner' ? <form className="growth-form" action={submit}><div className="field"><label htmlFor="measuredAt">Measurement date</label><input id="measuredAt" name="measuredAt" type="date" max={maxDate} required /></div><div className="growth-form-metrics"><div className="field"><label htmlFor="heightCm">Height (cm)</label><input id="heightCm" name="heightCm" type="number" min="30" max="140" step="0.1" /></div><div className="field"><label htmlFor="weightKg">Weight (kg)</label><input id="weightKg" name="weightKg" type="number" min="1" max="45" step="0.1" /></div></div><button className="button button-secondary" disabled={pending}>{pending ? 'Saving…' : 'Save measurement'}</button>{message ? <p className="form-status" aria-live="polite">{message}</p> : null}</form> : <p className="legal-note">Only this child profile’s owner can add or manage growth entries.</p>}</section>;
}
