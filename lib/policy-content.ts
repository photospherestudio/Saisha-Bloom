export const POLICY_VERSION = '2026-09-beta-2';

export const policyContent = {
  privacy: {
    title: 'Privacy notice',
    summary: 'How the beta handles family account details, observations, and private photos.',
    sections: [
      ['What we collect', 'We collect the account details, child profile details, observations, and media that you choose to add. We do not ask for identity documents.'],
      ['Why we use it', 'We use this information to provide the private family tracker, caregiver sharing, exports, reminders you opt into, and support.'],
      ['Who can see it', 'Only the child-profile owner and invited caregivers can access a shared child profile. Storage remains private and media is delivered with short-lived links.'],
      ['Retention and deletion', 'We keep account and child records while your account is active. You can export your eligible records and permanently delete owned child profiles or your account. Account deletion immediately blocks access, removes owned profiles and authored media, and erases your identity, notes, and photos from observations on other profiles. An anonymous status and date may remain for up to 30 days so the child-profile owner can choose to retain or delete it; the default is deletion. Operational logs are retained for up to 30 days and encrypted backups are rotated within 35 days, subject to documented recovery needs.'],
      ['Controller and contact', 'Saisha Bloom is operated by Sourav Deb. For privacy questions, deletion requests, or concerns, contact admin.nemesis@gmail.com.'],
      ['Service providers', 'We use Supabase (authentication, PostgreSQL database, and private object storage), Vercel (application hosting and aggregate analytics when enabled), and Resend (opted-in transactional and reminder email). Providers receive only the data needed for their service. Web Push uses your browser subscription endpoint only when you opt in. WhatsApp, SMS, and parental-verification providers are not enabled.'],
      ['Guardian attestation', 'During beta, the child-profile owner records a self-attestation that they are a parent or authorized guardian. We do not collect identity documents. A verifiable-parent provider may be introduced only after counsel review; until then provider integration remains disabled.'],
      ['Your choices', 'You can update your account, export eligible data, withdraw optional reminder consent, or request deletion from Account settings.'],
    ],
  },
  terms: {
    title: 'Terms of use',
    summary: 'The beta is a private family memory and guidepost tracker, not a medical service.',
    sections: [
      ['Not medical advice', 'Saisha Bloom provides source-linked developmental guideposts and family records. It does not diagnose, screen, or replace advice from a qualified health professional.'],
      ['Account responsibility', 'Keep your sign-in details private and invite only caregivers you trust. The child-profile owner controls sharing, export, editing, and deletion.'],
      ['Appropriate use', 'Upload only content that you are permitted to share. Do not use the service for emergencies or urgent health concerns.'],
      ['Your content and privacy choices', 'You retain your content. By using the service, you give Saisha Bloom permission to store and display it to the people you authorize, solely to provide the service. You may export or delete eligible content from Account settings.'],
      ['Suspension and deletion', 'We may suspend access to protect families, the service, or the law. You may stop using the beta at any time. Account and child-profile deletion is permanent and cannot be undone after the cleanup process completes.'],
      ['Beta availability', 'The beta may change while we improve it. We will give notice when a new policy version needs acknowledgment.'],
      ['Privacy and verification', 'The current policy version, controller contact, processor list, retention schedule, and beta self-attestation describe the controls currently offered. They are a product draft pending independent legal review and do not constitute legal advice or a claim of GDPR, DPDP, COPPA, or other compliance.'],
    ],
  },
} as const;

export function privacyContact() {
  return process.env.PRIVACY_CONTACT_EMAIL?.trim() || 'Privacy contact pending publication before production launch.';
}
