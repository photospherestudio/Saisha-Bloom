import type { WeeklyProgress as WeeklyProgressData } from '@/lib/weekly-progress';

export function WeeklyProgress({ progress }: { progress?: WeeklyProgressData }) {
  const current = progress ?? { total: 0, yes: 0, almost: 0, notYet: 0 };
  return <div className="weekly-progress" aria-label="This week’s progress"><div><strong>{current.total}</strong><span>check-ins this week</span></div><div><strong>{current.yes}</strong><span>noticed</span></div><div><strong>{current.almost}</strong><span>emerging</span></div><div><strong>{current.notYet}</strong><span>still growing</span></div></div>;
}
