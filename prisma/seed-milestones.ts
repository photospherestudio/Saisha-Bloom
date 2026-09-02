import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const prisma = new PrismaClient();
const seedDataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'seed-data');

type CdcMilestone = {
  ageMonths: number;
  domain: string;
  text: string;
  source: string;
  sourceUrl: string;
};

type WhoMilestone = {
  name: string;
  domain: string;
  p1_months: number;
  median_months: number;
  p99_months: number;
};

type Guidance = {
  externalId: string;
  title: string;
  summary: string;
  domain: string;
  ageRangeMinMonths: number;
  ageRangeMaxMonths: number;
  kind: string;
  sourceKey: string;
  sourceName: string;
  sourceUrl: string;
  reviewedAt: string;
};

type EmergenceData = {
  reviewedAt: string;
  cdc: { checkpoints: number[]; source: string; sourceUrl: string };
  who: { source: string; sourceUrl: string; milestones: Array<{ name: string; minMonths: number; maxMonths: number }> };
};

function readJson<T>(name: string): T {
  const file = path.join(seedDataDir, name);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing ${file}. Run prisma/scrape-cdc-milestones.mjs, review its output, then seed again.`);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

function normalizeDomain(raw: string) {
  if (raw.startsWith('Social')) return 'social_emotional';
  if (raw.startsWith('Language')) return 'language_communication';
  if (raw.startsWith('Cognitive')) return 'cognitive';
  if (raw.startsWith('Movement')) return 'movement_physical';
  return 'other';
}

async function main() {
  const cdcData = readJson<CdcMilestone[]>('cdc-milestones-raw.json');
  const whoData = readJson<{ milestones: WhoMilestone[] }>('who-motor-milestones.json');
  const guidanceData = readJson<Guidance[]>('guidance.json');
  const emergenceData = readJson<EmergenceData>('emergence-windows.json');
  // ponytail: short reviewed summaries now; upgrade to licensed full-content ingestion only after rights review.

  const milestoneData = [...cdcData.map((item) => ({
    title: item.text,
    domain: normalizeDomain(item.domain),
    ageRangeMinMonths: item.ageMonths,
    ageRangeMaxMonths: item.ageMonths,
    source: item.source,
    sourceUrl: item.sourceUrl,
  })), ...whoData.milestones.map((item) => ({
    title: item.name,
    domain: normalizeDomain(item.domain),
    ageRangeMinMonths: item.p1_months,
    ageRangeMaxMonths: item.p99_months,
    source: 'WHO Multicentre Growth Reference Study',
    sourceUrl: 'https://www.who.int/tools/child-growth-standards/standards/motor-development-milestones',
  }))];
  const seededMilestones: Array<{ id: string; title: string; source: string; sourceUrl: string; checkpoint: number }> = [];
  for (const m of milestoneData) {
    const existing = await prisma.milestone.findFirst({ where: { title: m.title, source: m.source } });
    const milestone = existing
      ? await prisma.milestone.update({ where: { id: existing.id }, data: m })
      : await prisma.milestone.create({ data: m });
    seededMilestones.push({ id: milestone.id, title: milestone.title, source: milestone.source, sourceUrl: milestone.sourceUrl, checkpoint: milestone.ageRangeMaxMonths });
  }

  const reviewedAt = new Date(emergenceData.reviewedAt);
  const cdcCheckpoints = [...emergenceData.cdc.checkpoints].sort((left, right) => left - right);
  for (const milestone of seededMilestones) {
    let window: { minMonths: number; maxMonths: number; source: string; sourceUrl: string } | null = null;
    if (milestone.source === 'CDC Learn the Signs. Act Early.') {
      const checkpointIndex = cdcCheckpoints.indexOf(milestone.checkpoint);
      if (checkpointIndex >= 0) window = { minMonths: checkpointIndex === 0 ? 0 : cdcCheckpoints[checkpointIndex - 1], maxMonths: milestone.checkpoint, source: emergenceData.cdc.source, sourceUrl: milestone.sourceUrl };
    } else {
      const whoWindow = emergenceData.who.milestones.find((item) => item.name === milestone.title);
      if (whoWindow) window = { minMonths: whoWindow.minMonths, maxMonths: whoWindow.maxMonths, source: emergenceData.who.source, sourceUrl: emergenceData.who.sourceUrl };
    }
    if (window) await prisma.milestoneEmergenceWindow.upsert({ where: { milestoneId: milestone.id }, update: { ...window, reviewedAt }, create: { milestoneId: milestone.id, ...window, reviewedAt } });
  }

  await prisma.guidance.createMany({
    data: guidanceData.map((item) => ({ ...item, reviewedAt: new Date(item.reviewedAt) })),
    skipDuplicates: true,
  });

  console.info(`Seeded or updated ${cdcData.length} CDC, ${whoData.milestones.length} WHO, ${seededMilestones.length} emergence windows, and ${guidanceData.length} additional guidance records.`);
}

main()
  .catch(() => {
    console.error('Seed failed. Check the database configuration and seed files.');
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
