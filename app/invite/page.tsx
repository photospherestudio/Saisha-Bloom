import { AppHeader } from '@/components/AppHeader';
import InviteForm from './InviteForm';

export default async function InvitePage({ searchParams }: { searchParams?: Promise<{ token?: string }> }) {
  const token = (await searchParams)?.token ?? '';
  return <main className="page"><AppHeader backHref="/dashboard" /><InviteForm initialToken={token} /></main>;
}
