import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';

export default function OfflinePage() {
  return (
    <main className="page">
      <AppHeader />
      <section className="shell form-wrap">
        <div className="eyebrow">You are offline</div>
        <h1 className="display">We\'ll be here when you reconnect.</h1>
        <p className="form-intro">Saisha Bloom keeps only the public welcome and demo experience available offline. Your family space is never stored on this device for offline reading.</p>
        <Link className="button button-primary" href="/">Return home</Link>
      </section>
    </main>
  );
}
