'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getCurrentAppUser } from '@/lib/auth';
import { requireChildOwner } from '@/lib/queries';
import { POLICY_VERSION } from '@/lib/policy-content';
import { logServerError, newCorrelationId } from '@/lib/http';

function actionError(error: string, correlationId = newCorrelationId()) {
  return { ok: false as const, error, correlationId };
}

export async function acceptCurrentPolicies(input: { terms: boolean; privacy: boolean }) {
  if (!input.terms || !input.privacy) return actionError('Please acknowledge both documents to continue.');
  try {
    const user = await getCurrentAppUser();
    if (!user) return actionError('Sign in to record your acknowledgment.');
    await db.$transaction([
      db.policyAcceptance.upsert({ where: { userId_document_version: { userId: user.id, document: 'terms', version: POLICY_VERSION } }, update: { acceptedAt: new Date() }, create: { userId: user.id, document: 'terms', version: POLICY_VERSION } }),
      db.policyAcceptance.upsert({ where: { userId_document_version: { userId: user.id, document: 'privacy', version: POLICY_VERSION } }, update: { acceptedAt: new Date() }, create: { userId: user.id, document: 'privacy', version: POLICY_VERSION } }),
    ]);
    revalidatePath('/consent');
    revalidatePath('/dashboard');
    return { ok: true as const };
  } catch (error) {
    const correlationId = newCorrelationId();
    logServerError(correlationId, error);
    return actionError('Your acknowledgment could not be saved.', correlationId);
  }
}

export async function attestChildGuardian(input: { childId: string; attested: boolean }) {
  if (!input.attested) return actionError('Confirm that you are this child’s parent or legal guardian.');
  try {
    await requireChildOwner(input.childId);
    await db.child.update({
      where: { id: input.childId },
      data: {
        guardianAttestedAt: new Date(),
        guardianNoticeVersion: POLICY_VERSION,
        guardianVerificationMethod: 'self_attested',
        guardianVerificationRef: null,
      },
    });
    revalidatePath('/consent');
    revalidatePath('/dashboard');
    return { ok: true as const };
  } catch (error) {
    const correlationId = newCorrelationId();
    logServerError(correlationId, error);
    return actionError('Only the child profile owner can provide this attestation.', correlationId);
  }
}

export async function getConsentStatus() {
  const user = await getCurrentAppUser();
  if (!user) return null;
  const [accepted, children] = await Promise.all([
    db.policyAcceptance.findMany({ where: { userId: user.id, version: POLICY_VERSION }, select: { document: true } }),
    db.child.findMany({ where: { userId: user.id }, select: { id: true, name: true, guardianAttestedAt: true, guardianNoticeVersion: true }, orderBy: { createdAt: 'asc' } }),
  ]);
  return {
    acceptedTerms: accepted.some((item) => item.document === 'terms'),
    acceptedPrivacy: accepted.some((item) => item.document === 'privacy'),
    children: children.map((child) => ({ ...child, guardianAttestedAt: child.guardianAttestedAt?.toISOString() ?? null, attested: child.guardianNoticeVersion === POLICY_VERSION && Boolean(child.guardianAttestedAt) })),
  };
}
