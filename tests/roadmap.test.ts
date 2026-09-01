import test from 'node:test';
import assert from 'node:assert/strict';
import { startOfWeekInTimeZone, summarizeWeeklyProgress } from '../lib/weekly-progress.ts';
import { reviewedMilestoneTitle } from '../lib/milestone-copy.ts';

test('weekly progress counts the latest response for each milestone once', () => {
  const progress = summarizeWeeklyProgress([
    { milestoneId: 'm1', status: 'not_yet', createdAt: '2026-08-31T02:00:00Z' },
    { milestoneId: 'm1', status: 'yes', createdAt: '2026-08-31T03:00:00Z' },
    { milestoneId: 'm2', status: 'almost', createdAt: '2026-08-31T04:00:00Z' },
  ]);
  assert.deepEqual(progress, { total: 2, yes: 1, almost: 1, notYet: 0 });
});

test('weekly progress uses Monday in the viewer timezone', () => {
  const monday = startOfWeekInTimeZone(new Date('2026-09-01T00:30:00Z'), 'Asia/Kolkata');
  assert.equal(monday.toISOString(), '2026-08-30T18:30:00.000Z');
});

test('reviewed copy removes gendered CDC pronouns', () => {
  assert.equal(reviewedMilestoneTitle('She uses her hands to play'), 'your child uses your child’s hands to play');
});
