import { microGuideFor } from '@/lib/micro-guides';

function GuideIllustration({ scene, alt }: { scene: 'offer' | 'notice' | 'try'; alt: string }) {
  const showSecondHand = scene !== 'offer';
  const showSpark = scene === 'try';
  return <svg className="micro-guide-art" viewBox="0 0 160 110" role="img" aria-label={alt}><rect x="8" y="8" width="144" height="94" rx="24" fill="#edf3ea" /><circle cx="49" cy="51" r="17" fill="#dfaa82" /><path d="M49 68v18M30 88h38" stroke="#35513e" strokeWidth="8" strokeLinecap="round" /><rect x="91" y="48" width="26" height="26" rx="7" fill="#c1587a" transform="rotate(12 104 61)" />{showSecondHand ? <path d="M124 80c-7-9-13-16-22-18" stroke="#6b5b7a" strokeWidth="8" strokeLinecap="round" /> : null}{showSpark ? <path d="m129 26 3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#f0b429" /> : null}</svg>;
}

export function MicroGuide({ milestoneTitle }: { milestoneTitle: string }) {
  const guide = microGuideFor(milestoneTitle);
  if (!guide) return null;
  return (
    <section className="micro-guide" aria-labelledby={`micro-guide-${guide.id}`}>
      <div className="eyebrow">A small visual guide</div>
      <h2 id={`micro-guide-${guide.id}`}>{guide.title}</h2>
      <div className="micro-guide-frames">
        {guide.frames.map((frame, index) => <figure key={frame.caption}><GuideIllustration scene={frame.scene} alt={frame.alt} /><figcaption><strong>{index + 1}.</strong> {frame.caption}</figcaption></figure>)}
      </div>
      <p className="micro-guide-note">A guidepost, not a deadline. <a className="source-link" href={guide.sourceUrl} target="_blank" rel="noreferrer">{guide.source} ↗</a> · reviewed {guide.reviewedAt}</p>
    </section>
  );
}
