import Link from 'next/link';
import { hasSupabaseConfig } from '@/lib/auth';
import { AuthControls } from '@/components/AuthControls';

export function AppHeader({ backHref }: { backHref?: string }) {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="wordmark" href="/">
          <img className="wordmark-mark" src="/saisha-bloom-logo.png" alt="" aria-hidden="true" />
          Saisha Bloom
        </Link>
        <div className="header-actions">
          {backHref ? <Link className="header-back" href={backHref}>Back</Link> : <Link className="header-link" href="/dashboard">Open tracker</Link>}
          {hasSupabaseConfig() ? <AuthControls /> : null}
        </div>
      </div>
    </header>
  );
}
