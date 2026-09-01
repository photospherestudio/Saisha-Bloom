import type { EmergenceWindow as EmergenceWindowData } from '@/lib/emergence-window';

export function EmergenceWindow({ window }: { window: EmergenceWindowData | null }) {
  if (!window) return <p className="legal-note">This is a guidepost, not a deadline. Saisha Bloom does not infer an expected range without a complete reviewed source record.</p>;
  const range = window.minMonths === window.maxMonths ? `${window.minMonths} months` : `${window.minMonths}–${window.maxMonths} months`;
  return <aside className="emergence-window"><div className="eyebrow">Reviewed emergence window</div><strong>{range}</strong><p>Source-specific context only; not a diagnosis or an overdue signal.</p><a className="source-link" href={window.sourceUrl} target="_blank" rel="noreferrer">{window.source} ↗</a><small>Reviewed {new Date(window.reviewedAt).toLocaleDateString()}</small></aside>;
}
