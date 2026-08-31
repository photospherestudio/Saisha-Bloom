import { Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { db } from './db';

export async function consumeAuthAttempt(kind: 'login' | 'signup', limit: number, windowMs: number) {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get('x-forwarded-for');
  const ip = requestHeaders.get('x-real-ip') ?? forwardedFor?.split(',')[0]?.trim() ?? 'unknown';
  const ipHash = createHash('sha256').update(ip).digest('hex');
  const key = `auth:${kind}:${ipHash}`;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await db.$transaction(async (tx) => {
        const current = await tx.authRateLimit.findUnique({ where: { key } });
        if (!current || current.windowStart.getTime() !== windowStart.getTime()) {
          await tx.authRateLimit.upsert({ where: { key }, update: { windowStart, attempts: 1 }, create: { key, windowStart, attempts: 1 } });
          return true;
        }
        if (current.attempts >= limit) return false;
        const updated = await tx.authRateLimit.updateMany({ where: { key, windowStart: current.windowStart }, data: { attempts: { increment: 1 } } });
        if (!updated.count) throw new Error('Rate-limit counter changed during update.');
        return true;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if ((error as { code?: string }).code !== 'P2034' || attempt === 2) throw error;
    }
  }
  throw new Error('Rate-limit check failed.');
}
