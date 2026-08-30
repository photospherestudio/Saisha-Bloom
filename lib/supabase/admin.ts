import { createClient } from '@supabase/supabase-js';

export function hasSupabaseAdminConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
}

export function createAdminClient() {
  if (!hasSupabaseAdminConfig()) throw new Error('Supabase service credentials are not configured.');
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secretKey!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
