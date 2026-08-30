'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ChildSummary } from './saisha-ui';

export function ChildSwitcher({ active, initialChildren = [] }: { active: ChildSummary; initialChildren?: ChildSummary[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [children, setChildren] = useState<ChildSummary[]>(initialChildren.length ? initialChildren : [active]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/children', { headers: { Accept: 'application/json' } })
      .then((response) => response.ok ? response.json() : null)
      .then((value) => {
        const next = Array.isArray(value) ? value : value?.children;
        if (!cancelled && Array.isArray(next) && next.length) setChildren(next);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  function switchChild(childId: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.set('childId', childId);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <label className="child-switcher">
      <span className="sr-only">Active child</span>
      <span className="profile-chip-mark">{active.name[0]?.toUpperCase()}</span>
      <select aria-label="Switch child profile" value={active.id} onChange={(event) => switchChild(event.target.value)}>
        {children.map((child) => <option value={child.id} key={child.id}>{child.name}</option>)}
        <option value="__add__" disabled>Add another child from onboarding</option>
      </select>
    </label>
  );
}
