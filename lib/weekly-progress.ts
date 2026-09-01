export type WeeklyProgress = { total: number; yes: number; almost: number; notYet: number };

export const emptyWeeklyProgress: WeeklyProgress = { total: 0, yes: 0, almost: 0, notYet: 0 };

export function startOfWeek(date = new Date()) {
  const start = new Date(date);
  const day = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function startOfWeekInTimeZone(date = new Date(), timeZone = 'UTC') {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(date);
  } catch {
    timeZone = 'UTC';
  }
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);
  const wallMidnight = Date.UTC(year, month - 1, day);
  const mondayWall = wallMidnight - ((new Date(wallMidnight).getUTCDay() + 6) % 7) * 86400000;
  const offsetParts = new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(mondayWall));
  const wallAtZone = Date.UTC(Number(offsetParts.find((part) => part.type === 'year')?.value), Number(offsetParts.find((part) => part.type === 'month')?.value) - 1, Number(offsetParts.find((part) => part.type === 'day')?.value), Number(offsetParts.find((part) => part.type === 'hour')?.value), Number(offsetParts.find((part) => part.type === 'minute')?.value), Number(offsetParts.find((part) => part.type === 'second')?.value));
  return new Date(mondayWall - (wallAtZone - mondayWall));
}

type WeeklyEntry = { milestoneId: string; status: string; createdAt: Date | string };

export function summarizeWeeklyProgress(input: string[] | WeeklyEntry[]): WeeklyProgress {
  const entries: WeeklyEntry[] = input.length && typeof input[0] !== 'string' ? input as WeeklyEntry[] : (input as string[]).map((status, index) => ({ milestoneId: String(index), status, createdAt: new Date(0) }));
  const latest = new Map<string, WeeklyEntry>();
  for (const entry of entries) {
    const current = latest.get(entry.milestoneId);
    if (!current || new Date(entry.createdAt).getTime() >= new Date(current.createdAt).getTime()) latest.set(entry.milestoneId, entry);
  }
  return [...latest.values()].reduce((progress, { status }) => ({
    total: progress.total + 1,
    yes: progress.yes + (status === 'yes' ? 1 : 0),
    almost: progress.almost + (status === 'almost' ? 1 : 0),
    notYet: progress.notYet + (status === 'not_yet' ? 1 : 0),
  }), { ...emptyWeeklyProgress });
}
