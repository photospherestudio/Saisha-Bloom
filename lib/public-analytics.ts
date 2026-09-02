export type PublicAnalyticsSurface = 'landing' | 'demo';

export function publicAnalyticsSurface(pathname: string): PublicAnalyticsSurface | null {
  if (pathname === '/') return 'landing';
  if (pathname === '/child/demo/checklist') return 'demo';
  return null;
}
