import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { contentHash, diffCdcMilestones, normalizeCdcMilestones } from '../scripts/cdc-content-review.mjs';

const complete = { ageMonths: 2, domain: 'Social/Emotional', text: 'Calms when spoken to', source: 'CDC Learn the Signs. Act Early.', sourceUrl: 'https://www.cdc.gov/act-early/' };

test('CDC content review validates, hashes, and reports exact changes', () => {
  assert.throws(() => normalizeCdcMilestones([{ ...complete, sourceUrl: '' }]));
  assert.equal(contentHash([complete]), contentHash([{ ...complete }]));
  const changed = { ...complete, text: 'Looks at your face' };
  assert.deepEqual(diffCdcMilestones([complete], [changed]), { added: [changed], removed: [complete] });
});

test('reviewed emergence data contains six WHO windows and CDC checkpoints', () => {
  const data = JSON.parse(fs.readFileSync(new URL('../prisma/seed-data/emergence-windows.json', import.meta.url), 'utf8'));
  assert.equal(data.who.milestones.length, 6);
  assert.deepEqual(data.who.milestones[0], { name: 'Sitting without support', minMonths: 3.8, maxMonths: 9.2 });
  assert.deepEqual(data.cdc.checkpoints, [2, 4, 6, 9, 12, 15, 18, 24, 30, 36, 48, 60]);
});
