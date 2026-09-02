import fs from 'node:fs/promises';
import path from 'node:path';
import { contentHash, diffCdcMilestones, readCdcMilestones } from './cdc-content-review.mjs';

const reviewer = process.argv.find((arg) => arg.startsWith('--reviewer='))?.slice('--reviewer='.length).trim();
const reviewedAt = process.argv.find((arg) => arg.startsWith('--reviewed-at='))?.slice('--reviewed-at='.length).trim();
if (!process.argv.includes('--approve') || !reviewer || !reviewedAt || Number.isNaN(new Date(reviewedAt).getTime())) {
  throw new Error('Refusing to replace approved CDC content. After a human review, run with --approve --reviewer="Name" --reviewed-at=YYYY-MM-DD.');
}

const approvedPath = path.join('prisma', 'seed-data', 'cdc-milestones-raw.json');
const candidatePath = path.join('prisma', 'seed-data', 'cdc-milestones-candidate.json');
const reviewPath = path.join('prisma', 'seed-data', 'cdc-milestones-review.json');
const [approved, candidate] = await Promise.all([readCdcMilestones(approvedPath), readCdcMilestones(candidatePath)]);
const diff = diffCdcMilestones(approved, candidate);

await fs.writeFile(approvedPath, `${JSON.stringify(candidate, null, 2)}\n`, 'utf8');
await fs.writeFile(reviewPath, `${JSON.stringify({
  status: 'approved-after-manual-review',
  reviewer,
  reviewedAt: new Date(reviewedAt).toISOString(),
  candidateSha256: contentHash(candidate),
  replacesSha256: contentHash(approved),
  summary: { approved: approved.length, candidate: candidate.length, added: diff.added.length, removed: diff.removed.length },
}, null, 2)}\n`, 'utf8');
console.log(`Approved ${candidate.length} CDC records after the asserted manual review. Review manifest: ${reviewPath}`);
