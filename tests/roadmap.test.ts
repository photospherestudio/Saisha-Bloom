import test from 'node:test';
import assert from 'node:assert/strict';
import { startOfWeekInTimeZone, summarizeWeeklyProgress } from '../lib/weekly-progress.ts';
import { reviewedMilestoneTitle } from '../lib/milestone-copy.ts';
import { genericPushPayload } from '../lib/push-payload.ts';
import { microGuides } from '../lib/micro-guides.ts';
import { shouldSendDeletionFailureAlert } from '../lib/account-deletion-alert.ts';
import { publicAnalyticsSurface } from '../lib/public-analytics.ts';

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
  assert.equal(reviewedMilestoneTitle('She uses her hands to play'), 'Your child uses their hands to play');
  assert.equal(reviewedMilestoneTitle('Puts things in her mouth'), 'Puts things in their mouth');
  assert.equal(reviewedMilestoneTitle('Moves things to her other hand'), 'Moves things to their other hand');
});

test('invalid viewer timezones safely fall back to UTC', () => {
  assert.equal(startOfWeekInTimeZone(new Date('2026-09-01T00:30:00Z'), 'not/a-zone').toISOString(), startOfWeekInTimeZone(new Date('2026-09-01T00:30:00Z'), 'UTC').toISOString());
});

test('push payloads stay generic and contain no profile data', () => {
  assert.deepEqual(genericPushPayload('caregiver'), { title: 'Saisha Bloom', body: 'A caregiver added a new Saisha Bloom observation.', url: '/dashboard' });
});

test('the reviewed micro-guide pilot contains eight complete guides', () => {
  assert.equal(microGuides.length, 8);
  for (const guide of microGuides) {
    assert.ok(guide.source && guide.reviewedAt && guide.frames.length > 1);
    assert.ok(guide.frames.every((frame) => frame.alt && frame.caption));
  }
});

test('account deletion alerts begin after the third failure', () => {
  assert.equal(shouldSendDeletionFailureAlert(2), false);
  assert.equal(shouldSendDeletionFailureAlert(3), true);
});

test('custom analytics maps only approved public surfaces', () => {
  assert.equal(publicAnalyticsSurface('/'), 'landing');
  assert.equal(publicAnalyticsSurface('/child/demo/checklist'), 'demo');
  assert.equal(publicAnalyticsSurface('/dashboard'), null);
  assert.equal(publicAnalyticsSurface('/child/private/checklist'), null);
});
