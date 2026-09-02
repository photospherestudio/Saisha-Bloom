import path from 'node:path';
import { contentHash, diffCdcMilestones, readCdcMilestones } from './cdc-content-review.mjs';

const approvedPath = path.join('prisma', 'seed-data', 'cdc-milestones-raw.json');
const candidatePath = path.join('prisma', 'seed-data', 'cdc-milestones-candidate.json');

const [approved, candidate] = await Promise.all([readCdcMilestones(approvedPath), readCdcMilestones(candidatePath)]);
const diff = diffCdcMilestones(approved, candidate);
console.log(JSON.stringify({
  approvedPath,
  candidatePath,
  approvedSha256: contentHash(approved),
  candidateSha256: contentHash(candidate),
  added: diff.added,
  removed: diff.removed,
  summary: { approved: approved.length, candidate: candidate.length, added: diff.added.length, removed: diff.removed.length },
}, null, 2));
