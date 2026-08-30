import { growthReferenceForAge } from '@/lib/growth-reference';

export function GrowthReference({ ageInMonths, heightCm, weightKg }: { ageInMonths: number; heightCm?: number | null; weightKg?: number | null }) {
  const reference = growthReferenceForAge(ageInMonths);
  if (!reference) return null;

  return (
    <section className="panel growth-panel">
      <div className="eyebrow">Growing, at a glance</div>
      <div className="panel-head"><div><h2>Age-only reference</h2><p className="muted">Around {reference.ageMonths} months · broad reference band</p></div></div>
      <div className="growth-grid">
        <div className="growth-stat"><span>Length / height</span><strong>{reference.heightMinCm.toFixed(1)}–{reference.heightMaxCm.toFixed(1)} cm</strong>{heightCm ? <small>Latest entry: {heightCm.toFixed(1)} cm</small> : null}</div>
        <div className="growth-stat"><span>Weight</span><strong>{reference.weightMinKg.toFixed(1)}–{reference.weightMaxKg.toFixed(1)} kg</strong>{weightKg ? <small>Latest entry: {weightKg.toFixed(1)} kg</small> : null}</div>
      </div>
      <p className="legal-note">A simple age-only guide, not a diagnosis. For children under 2, length is usually measured lying down. Growth trend and weight-for-length/height are more useful than one number.</p>
    </section>
  );
}
