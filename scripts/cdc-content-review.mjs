import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';

export function normalizeCdcMilestones(records) {
  if (!Array.isArray(records)) throw new Error('CDC content must be a JSON array.');
  return records.map((record) => {
    if (!record || !Number.isInteger(record.ageMonths) || !record.domain?.trim() || !record.text?.trim() || !record.source?.trim() || !/^https:\/\//.test(record.sourceUrl ?? '')) {
      throw new Error('CDC content has an incomplete record.');
    }
    return {
      ageMonths: record.ageMonths,
      domain: record.domain.trim(),
      text: record.text.trim(),
      source: record.source.trim(),
      sourceUrl: record.sourceUrl.trim(),
    };
  }).sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
}

export function contentHash(records) {
  return createHash('sha256').update(`${JSON.stringify(normalizeCdcMilestones(records))}\n`).digest('hex');
}

function key(record) {
  return JSON.stringify(record);
}

export function diffCdcMilestones(approved, candidate) {
  const approvedByKey = new Map(normalizeCdcMilestones(approved).map((record) => [key(record), record]));
  const candidateByKey = new Map(normalizeCdcMilestones(candidate).map((record) => [key(record), record]));
  return {
    added: [...candidateByKey].filter(([recordKey]) => !approvedByKey.has(recordKey)).map(([, record]) => record),
    removed: [...approvedByKey].filter(([recordKey]) => !candidateByKey.has(recordKey)).map(([, record]) => record),
  };
}

export async function readCdcMilestones(path) {
  return normalizeCdcMilestones(JSON.parse(await fs.readFile(path, 'utf8')));
}
