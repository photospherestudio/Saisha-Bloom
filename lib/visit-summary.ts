import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { childAge, cdcCheckpointForAge } from './age';
import { db } from './db';
import { requireChildAccess } from './queries';

type SummaryItem = { title: string; domain: string; date?: string };
export type VisitSummary = {
  child: { id: string; name: string; dob: string; gestationalWeeks: number | null };
  age: ReturnType<typeof childAge>;
  checkpoint: number;
  groups: Record<'yes' | 'almost' | 'not_yet' | 'unobserved', SummaryItem[]>;
  recentNotes: { note: string; date: string; photoCount: number }[];
};

export async function getVisitSummary(childId: string): Promise<VisitSummary> {
  const { child } = await requireChildAccess(childId);
  const age = childAge(child.dob, child.gestationalWeeks);
  const checkpoint = cdcCheckpointForAge(age.activeAgeInMonths);
  const milestones = await db.milestone.findMany({
    where: { source: 'CDC Learn the Signs. Act Early.', domain: { in: ['social_emotional', 'language_communication', 'cognitive', 'movement_physical'] }, ageRangeMinMonths: checkpoint, ageRangeMaxMonths: checkpoint },
    orderBy: [{ domain: 'asc' }, { title: 'asc' }],
    include: { responses: { where: { childId }, orderBy: { createdAt: 'desc' }, take: 1 } },
  });
  const groups: VisitSummary['groups'] = { yes: [], almost: [], not_yet: [], unobserved: [] };
  milestones.forEach((milestone) => {
    const response = milestone.responses[0];
    const status = response?.status === 'yes' || response?.status === 'almost' || response?.status === 'not_yet' ? response.status : 'unobserved';
    groups[status].push({ title: milestone.title, domain: milestone.domain, date: response?.createdAt.toISOString() });
  });
  const recentNotes = await db.milestoneResponse.findMany({
    where: { childId, note: { not: null } }, orderBy: { createdAt: 'desc' }, take: 3,
    select: { note: true, createdAt: true, _count: { select: { media: true } } },
  });
  return { child: { id: child.id, name: child.name, dob: child.dob.toISOString(), gestationalWeeks: child.gestationalWeeks }, age, checkpoint, groups, recentNotes: recentNotes.map((item) => ({ note: item.note!, date: item.createdAt.toISOString(), photoCount: item._count.media })) };
}

function wrap(text: string, max = 82) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if (`${line} ${word}`.trim().length > max && line) { lines.push(line); line = word; } else line = `${line} ${word}`.trim();
  }
  if (line) lines.push(line);
  return lines;
}

export async function createVisitSummaryPdf(summary: VisitSummary) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let y = 800;
  const write = (text: string, size = 9, font = regular, color = rgb(0.16, 0.2, 0.22)) => {
    if (y < 105) return false;
    page.drawText(text, { x: 42, y, size, font, color });
    y -= size + 4;
    return true;
  };
  const label = (text: string) => { write(text.toUpperCase(), 8, bold, rgb(0.34, 0.43, 0.39)); };
  write('Saisha Bloom · Pediatrician visit summary', 16, bold);
  write(`${summary.child.name} · CDC ${summary.checkpoint}-month guideposts`, 10, bold);
  const corrected = summary.age.usesCorrectedAge ? ` · corrected age ${summary.age.correctedAgeInMonths.toFixed(1)} mo` : '';
  write(`Chronological age ${summary.age.chronologicalAgeInMonths.toFixed(1)} mo${corrected}`);
  y -= 6;
  const labels: { heading: string; items: SummaryItem[] }[] = [
    { heading: 'Noticed', items: summary.groups.yes },
    { heading: 'Almost', items: summary.groups.almost },
    { heading: 'Not yet', items: [...summary.groups.not_yet, ...summary.groups.unobserved] },
  ];
  for (const { heading, items } of labels) {
    label(`${heading} (${items.length})`);
    if (!items.length) write('None recorded.', 8);
    for (const item of items.slice(0, 6)) {
      const date = item.date ? ` · ${new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : '';
      const lines = wrap(item.title, 76).slice(0, 2);
      for (const [index, line] of lines.entries()) write(`${index === 0 ? '• ' : '  '}${line}${index === 0 ? date : ''}`, 8);
    }
    if (items.length > 6) write(`• +${items.length - 6} more guideposts`, 8, regular, rgb(0.35, 0.38, 0.4));
    y -= 2;
  }
  if (summary.recentNotes.length && y > 105) {
    label('Recent observations');
    for (const note of summary.recentNotes) {
      const suffix = note.photoCount ? ` (${note.photoCount} photo${note.photoCount === 1 ? '' : 's'})` : '';
      for (const [index, line] of wrap(note.note.slice(0, 180), 78).slice(0, 2).entries()) write(`${index === 0 ? '• ' : '  '}${line}${index === 0 ? suffix : ''}`, 8);
    }
  }
  y = Math.max(45, y - 8);
  page.drawText('This is a memory aid, not a developmental screening or diagnosis. Discuss questions with your child\'s pediatrician. CDC Learn the Signs. Act Early. sources inform these guideposts.', { x: 42, y, maxWidth: 510, size: 7, font: regular, color: rgb(0.35, 0.38, 0.4), lineHeight: 9 });
  return pdf.save();
}
