export type WeeklyProgress = { total: number; yes: number; almost: number; notYet: number };

export const emptyWeeklyProgress: WeeklyProgress = { total: 0, yes: 0, almost: 0, notYet: 0 };

export function startOfWeek(date = new Date()) {
  const start = new Date(date);
  const day = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function summarizeWeeklyProgress(statuses: string[]): WeeklyProgress {
  return statuses.reduce((progress, status) => ({
    total: progress.total + 1,
    yes: progress.yes + (status === 'yes' ? 1 : 0),
    almost: progress.almost + (status === 'almost' ? 1 : 0),
    notYet: progress.notYet + (status === 'not_yet' ? 1 : 0),
  }), { ...emptyWeeklyProgress });
}
