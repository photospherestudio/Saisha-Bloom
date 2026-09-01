const neutralReplacements: Array<[RegExp, string]> = [
  [/\bher\b(?=\s+(?:hands|name|toys|fingers|body|cup|food|book|blocks|feet|face|hair)\b)/gi, 'your child’s'],
  [/\bher\b/gi, 'your child'],
  [/\bhis\b/gi, 'your child’s'],
  [/\bshe\b/gi, 'your child'],
  [/\bhe\b/gi, 'your child'],
  [/\bhim\b/gi, 'your child'],
];

/** Reviewed name-first copy: raw CDC titles stay untouched in the database. */
export function reviewedMilestoneTitle(title: string) {
  return neutralReplacements.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), title);
}
