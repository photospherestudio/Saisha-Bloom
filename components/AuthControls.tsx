'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function AuthControls() {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => subscription.unsubscribe();
  }, []);

  if (signedIn) {
    return <button className="header-link" type="button" onClick={async () => { await createClient().auth.signOut(); router.push('/'); router.refresh(); }}>Sign out</button>;
  }

  return <><Link className="header-link" href="/sign-in">Sign in</Link><Link className="header-link" href="/sign-up">Sign up</Link></>;
}
