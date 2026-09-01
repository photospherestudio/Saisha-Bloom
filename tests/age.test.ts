import assert from 'node:assert/strict';
import test from 'node:test';
import { cdcCheckpointForAge, childAge, correctedAgeInMonths, reminderCheckpointForAge } from '../lib/age.ts';

const now = new Date('2026-08-30T00:00:00.000Z');
const monthsAgo = (months: number) => new Date(now.getTime() - months * 30.4375 * 24 * 60 * 60 * 1000);

test('full-term infants keep chronological age', () => {
  assert.equal(correctedAgeInMonths(monthsAgo(6), 40, now), 6);
  assert.deepEqual(childAge(monthsAgo(6), 40, now).usesCorrectedAge, false);
});

test('prematurity subtracts the gestational gap before 24 months', () => {
  const age = childAge(monthsAgo(6), 32, now);
  assert.ok(Math.abs(age.correctedAgeInMonths - 4.16) < 0.01);
  assert.equal(age.activeAgeInMonths, age.correctedAgeInMonths);
});

test('corrected age clamps at zero and stops at 24 chronological months', () => {
  assert.equal(correctedAgeInMonths(monthsAgo(1), 28, now), 0);
  assert.equal(correctedAgeInMonths(monthsAgo(24), 28, now), 24);
});

test('CDC checkpoint selection follows the active age', () => {
  assert.equal(cdcCheckpointForAge(1), 2);
  assert.equal(cdcCheckpointForAge(10), 12);
  assert.equal(cdcCheckpointForAge(18.5), 18);
  assert.equal(cdcCheckpointForAge(60), 48);
  assert.equal(reminderCheckpointForAge(1), null);
  assert.equal(reminderCheckpointForAge(18.5), 18);
});
