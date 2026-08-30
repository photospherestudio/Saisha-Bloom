type ActivityIllustrationProps = {
  domain: string;
  title?: string;
  variant?: 'card' | 'compact';
};

export function activityVisualFor(title: string | undefined, domain: string) {
  const normalizedTitle = title?.toLowerCase() ?? '';
  if (normalizedTitle.includes('feeds ') && normalizedTitle.includes('fingers')) return 'feeding';
  if (normalizedTitle.includes('drinks from a cup') || normalizedTitle.includes('pours water')) return 'cup';
  if (normalizedTitle.includes('spoon') || normalizedTitle.includes('fork') || normalizedTitle.includes('food') || normalizedTitle.includes('breast or bottle')) return 'feeding';
  if (normalizedTitle.includes('climbs on and off a couch or chair')) return 'climbing';
  if (normalizedTitle.includes('chores') || normalizedTitle.includes('clean-up') || normalizedTitle.includes('helper') || normalizedTitle.includes('matching socks') || normalizedTitle.includes('clearing the table') || normalizedTitle.includes('wash them')) return 'chores';
  if (normalizedTitle.includes('follows rules') || normalizedTitle.includes('takes turns') || normalizedTitle.includes('plays next to other children')) return 'social';
  if (normalizedTitle.includes('follows ') || normalizedTitle.includes('gives you a toy') || normalizedTitle.includes('understands “no”') || normalizedTitle.includes('answers simple questions')) return 'directions';
  if (normalizedTitle.includes('book') || normalizedTitle.includes('story') || normalizedTitle.includes('song') || normalizedTitle.includes('rhyme') || normalizedTitle.includes('pages')) return 'book';
  if (normalizedTitle.includes('scribbl') || normalizedTitle.includes('draw') || normalizedTitle.includes('crayon') || normalizedTitle.includes('pencil') || normalizedTitle.includes('beads') || normalizedTitle.includes('macaroni') || normalizedTitle.includes('letters')) return 'art';
  if (normalizedTitle.includes('clothes') || normalizedTitle.includes('jacket') || normalizedTitle.includes('sleeve') || normalizedTitle.includes('buttons')) return 'dressing';
  if (normalizedTitle.includes('children') || normalizedTitle.includes('affection') || normalizedTitle.includes('hug') || normalizedTitle.includes('comfort') || normalizedTitle.includes('familiar people') || normalizedTitle.includes('your face') || normalizedTitle.includes('smile') || normalizedTitle.includes('laugh') || normalizedTitle.includes('calm') || normalizedTitle.includes('leave') || normalizedTitle.includes('peek-a-boo')) return 'social';
  if (domain === 'movement_physical') return 'movement';
  if (domain === 'language_communication') return 'book';
  if (domain === 'social_emotional') return 'social';
  return 'cognitive';
}

export function activityIllustrationSrc(title: string | undefined, domain: string) {
  const visual = activityVisualFor(title, domain);
  const sources: Record<string, string> = {
    feeding: '/illustrations/toddler-snack.png',
    cup: '/illustrations/toddler-cup.png',
    climbing: '/illustrations/toddler-couch.png',
    directions: '/illustrations/toddler-directions.png',
    chores: '/illustrations/toddler-chores.png',
    art: '/illustrations/toddler-art.png',
    book: '/illustrations/toddler-book.png',
    dressing: '/illustrations/toddler-dressing.png',
    social: '/illustrations/toddler-social.png',
    movement: '/illustrations/toddler-ramp.png',
    cognitive: '/illustrations/toddler-blocks.png',
  };
  return sources[visual] ?? sources.cognitive;
}

export function ActivityIllustration({ domain, title, variant = 'card' }: ActivityIllustrationProps) {
  return (
    <div className={`activity-illustration activity-illustration-${variant} activity-illustration-${activityVisualFor(title, domain)}`} aria-hidden="true">
      <span className="activity-shape activity-shape-one" />
      <span className="activity-shape activity-shape-two" />
      <span className="activity-shape activity-shape-three" />
      <span className="activity-shape activity-shape-four" />
    </div>
  );
}
