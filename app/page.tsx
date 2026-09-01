import Link from 'next/link';
import Image from 'next/image';
import { AppHeader } from '@/components/AppHeader';
import { InstallPrompt } from '@/components/InstallPrompt';

export default function HomePage() {
  return (
    <main className="page">
      <AppHeader />
      <section className="shell hero">
        <div>
          <div className="eyebrow">For the days that move quickly</div>
          <h1 className="display">Notice the little things.</h1>
          <p className="hero-copy">A calm place to follow your child’s growing story — grounded in trusted public-health guidance, made for real family life.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/onboarding">Start a child profile <span aria-hidden="true">↗</span></Link>
            <Link className="button button-secondary" href="/child/demo/checklist">See the tracker</Link>
          </div>
          <div className="hero-note"><span aria-hidden="true">✳</span> No pressure. No comparisons. Just a little more context.</div>
          <InstallPrompt />
        </div>
        <div className="hero-art">
          <Image className="hero-art-image" src="/illustrations/homepage-hero-clean.png" alt="A parent and child building a colorful block tower together" width={1254} height={1254} priority sizes="(max-width: 860px) 90vw, 540px" />
          <span className="art-spark" aria-hidden="true">✳</span>
        </div>
      </section>
    </main>
  );
}
