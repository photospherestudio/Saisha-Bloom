import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logServerError, newCorrelationId, withCorrelationId } from '@/lib/http';

function safeDestination(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/onboarding';
}

function confirmationError(request: Request, correlationId: string) {
  return withCorrelationId(NextResponse.redirect(new URL('/sign-in?error=confirmation', request.url)), correlationId);
}

export async function GET(request: Request) {
  const correlationId = newCorrelationId();
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const destination = safeDestination(url.searchParams.get('next'));
  if (!code) return confirmationError(request, correlationId);

  try {
    const { error } = await (await createClient()).auth.exchangeCodeForSession(code);
    if (error) {
      logServerError(correlationId, error);
      return confirmationError(request, correlationId);
    }
    return withCorrelationId(NextResponse.redirect(new URL(destination, request.url)), correlationId);
  } catch (error) {
    logServerError(correlationId, error);
    return confirmationError(request, correlationId);
  }
}
