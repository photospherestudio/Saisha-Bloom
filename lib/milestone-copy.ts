import reviewedNeutralCopy from '../prisma/seed-data/cdc-neutral-overrides.json' with { type: 'json' };

const neutralReplacements: Array<[RegExp, string]> = [
  [/\bher\b(?=\s+(?:hands|name|toys|fingers|body|cup|food|book|blocks|feet|face|hair|mouth|other|own|spoon|arm|day)\b)/gi, 'their'],
  [/\bher\b/gi, 'them'],
  [/\bhis\b/gi, 'their'],
  [/\bshe\b/gi, 'your child'],
  [/\bhe\b/gi, 'your child'],
  [/\bhim\b/gi, 'them'],
];

/** Reviewed name-first copy: raw CDC titles stay untouched in the database. */
export function reviewedMilestoneTitle(title: string) {
  const override = reviewedNeutralCopy.overrides[title as keyof typeof reviewedNeutralCopy.overrides];
  if (override) return override;
  return neutralReplacements.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), title);
}
