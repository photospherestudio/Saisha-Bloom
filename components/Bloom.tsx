import type { MilestoneStatus } from '@/lib/types';

export function Bloom({ status, size = 'medium' }: { status?: MilestoneStatus | null; size?: 'small' | 'medium' | 'large' }) {
  const state = status ?? 'not_yet';
  return (
    <svg className={`bloom bloom-${state} bloom-${size}`} viewBox="0 0 64 64" role="img" aria-hidden="true">
      <path className="bloom-stem" d="M32 58c0-7 0-14 0-22" />
      <path className="bloom-leaf" d="M31 48c-6-5-11-4-15 0 5 4 10 4 15 0Z" />
      {state === 'not_yet' ? <path className="bloom-petal" d="M32 40c-9 0-16-5-16-13 0-7 6-13 16-18 10 5 16 11 16 18 0 8-7 13-16 13Z" stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round" /> : null}
      {state === 'almost' ? <>
        <path className="bloom-petal" d="M31 39c-8 0-15-4-16-10-1-4 2-8 6-8 6 0 10 5 12 13 0 2 0 4-2 5Z" stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round" />
        <path className="bloom-petal" d="M33 39c8 0 15-4 16-10 1-4-2-8-6-8-6 0-10 5-12 13 0 2 0 4 2 5Z" stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round" />
        <path className="bloom-petal bloom-petal-inner" d="M32 36c-5-4-5-10-2-16 1-2 2-4 2-5 0 1 1 3 2 5 3 6 3 12-2 16Z" stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round" />
        <circle className="bloom-center" cx="32" cy="36" r="3" />
      </> : null}
      {state === 'yes' ? <>
        <path className="bloom-petal" d="M30 39c-8 0-15-4-17-10-1-5 2-9 7-9 6 0 11 5 13 14 0 2-1 4-3 5Z" stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round" />
        <path className="bloom-petal" d="M34 39c8 0 15-4 17-10 1-5-2-9-7-9-6 0-11 5-13 14 0 2 1 4 3 5Z" stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round" />
        <path className="bloom-petal bloom-petal-inner" d="M32 36c-5-4-6-11-3-18 1-3 2-6 3-8 1 2 2 5 3 8 3 7 2 14-3 18Z" stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round" />
        <circle className="bloom-center" cx="32" cy="36" r="4" />
      </> : null}
      <path className="bloom-sepal" d="M25 37c3 2 11 2 14 0-1 5-4 7-7 7s-6-2-7-7Z" />
    </svg>
  );
}
