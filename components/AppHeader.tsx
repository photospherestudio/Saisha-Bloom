import Link from 'next/link';
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { hasClerkConfig } from '@/lib/auth';

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
          {hasClerkConfig() ? <>
            <Show when="signed-out">
              <SignInButton mode="modal"><button className="header-link" type="button">Sign in</button></SignInButton>
              <SignUpButton mode="modal"><button className="header-link" type="button">Sign up</button></SignUpButton>
            </Show>
            <Show when="signed-in"><UserButton /></Show>
          </> : null}
        </div>
      </div>
    </header>
  );
}
