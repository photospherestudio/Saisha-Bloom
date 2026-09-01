import { transitionForAge } from '@/lib/transition-guidance';

export function TransitionCard({ ageMonths }: { ageMonths: number }) {
  const card = transitionForAge(ageMonths);
  return <aside className="transition-card"><div className="eyebrow">A little context</div><h2>{card.title}</h2><p>{card.copy}</p><a className="source-link" href={card.sourceUrl} target="_blank" rel="noreferrer">{card.source} ↗</a><small>Reviewed {card.reviewedAt}</small></aside>;
}
