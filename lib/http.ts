import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

const secretEnvNames = ['DATABASE_URL', 'SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY', 'CRON_SECRET', 'VERCEL_OIDC_TOKEN'];

export function newCorrelationId() {
  return randomUUID();
}

function redact(value: string) {
  let safe = value;
  for (const name of secretEnvNames) {
    const secret = process.env[name];
    if (secret) safe = safe.split(secret).join('[redacted]');
  }
  return safe
    .replace(/\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]+\b/g, '[redacted-key]')
    .replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, '[redacted-token]')
    .replace(/\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|rediss):\/\/[^\s"'<>]+/gi, '[redacted-database-url]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gi, 'Bearer [redacted-token]');
}

export function logServerError(id: string, error: unknown) {
  const detail = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`[server-error:${id}] ${redact(detail)}`);
}

export function withCorrelationId<T extends Response>(response: T, id: string) {
  response.headers.set('X-Correlation-ID', id);
  return response;
}

export function jsonError(message: string, status: number, id = newCorrelationId()) {
  return NextResponse.json({ error: message, correlationId: id }, { status, headers: { 'Cache-Control': 'no-store', 'X-Correlation-ID': id } });
}
