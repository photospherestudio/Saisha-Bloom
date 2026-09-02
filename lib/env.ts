const required = [
  'DATABASE_URL',
  'DIRECT_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SITE_URL',
  'RESEND_API_KEY',
  'REMINDER_FROM_EMAIL',
  'CRON_SECRET',
] as const;

function isPlaceholder(value: string) {
  return /(?:your[-_]|replace[-_]|set[-_]|change[-_]|placeholder|example(?:\.com)?|dummy|xxx)/i.test(value);
}

export function validateEnvironment() {
  const missing: string[] = required.filter((name) => !process.env[name] || isPlaceholder(process.env[name]!));
  const supabaseSecret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseSecret || isPlaceholder(supabaseSecret)) missing.push('SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY');
  if (process.env.CRON_SECRET && process.env.CRON_SECRET.length < 32) missing.push('CRON_SECRET (at least 32 characters)');
  const vapidNames = ['NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT'] as const;
  const configuredVapid = vapidNames.filter((name) => process.env[name]);
  if (configuredVapid.length > 0 && configuredVapid.length < vapidNames.length) missing.push('all VAPID settings together');

  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl && process.env.NODE_ENV === 'production') {
    if (!/[?&]sslmode=(?:require|verify-ca|verify-full)(?:&|$)/i.test(databaseUrl)) missing.push('DATABASE_URL with sslmode=require or stronger');
    try {
      const parsed = new URL(databaseUrl);
      const password = decodeURIComponent(parsed.password);
      if (!password || /^(?:postgres|password|admin|changeme|root)$/i.test(password)) missing.push('DATABASE_URL with a non-default password');
    } catch {
      missing.push('DATABASE_URL with a valid PostgreSQL URL');
    }
  }

  if (process.env.NODE_ENV === 'production' && /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::|\/|$)/i.test(process.env.NEXT_PUBLIC_SITE_URL ?? '')) missing.push('NEXT_PUBLIC_SITE_URL with the deployed HTTPS origin');
  if (process.env.NODE_ENV === 'production' && !/^https:\/\//i.test(process.env.NEXT_PUBLIC_SITE_URL ?? '')) missing.push('NEXT_PUBLIC_SITE_URL with the deployed HTTPS origin');
  for (const name of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SITE_URL']) {
    const value = process.env[name];
    if (!value) continue;
    try {
      const parsed = new URL(value);
      if (!['http:', 'https:'].includes(parsed.protocol)) missing.push(`${name} with a valid HTTP(S) URL`);
    } catch {
      missing.push(`${name} with a valid HTTP(S) URL`);
    }
  }
  if (missing.length) throw new Error(`Missing or unsafe environment configuration: ${[...new Set(missing)].join(', ')}`);
}
