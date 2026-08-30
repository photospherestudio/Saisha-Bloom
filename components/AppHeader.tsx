import Link from 'next/link';

export function AppHeader({ backHref }: { backHref?: string }) {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="wordmark" href="/">
          <span className="wordmark-mark" aria-hidden="true">✳</span>
          milestones
        </Link>
        {backHref ? <Link className="header-back" href={backHref}>Back</Link> : <Link className="header-link" href="/dashboard">Open tracker</Link>}
      </div>
    </header>
  );
}
