export const POLICY_VERSION = '2026-09-beta-1';

export const policyContent = {
  privacy: {
    title: 'Privacy notice',
    summary: 'How the beta handles family account details, observations, and private photos.',
    sections: [
      ['What we collect', 'We collect the account details, child profile details, observations, and media that you choose to add. We do not ask for identity documents.'],
      ['Why we use it', 'We use this information to provide the private family tracker, caregiver sharing, exports, reminders you opt into, and support.'],
      ['Who can see it', 'Only the child-profile owner and invited caregivers can access a shared child profile. Storage remains private and media is delivered with short-lived links.'],
      ['Retention and deletion', 'Owners can permanently delete a child profile after exporting it. Account deletion removes owned profiles and contributions. Contributions to other families are anonymized for 30 days so that the owner can choose whether to retain the status and date.'],
      ['Service providers', 'The deployed service uses Supabase for authentication, database, and private storage, and may use Resend for opted-in email reminders. The production processor list and retention schedule require legal approval before launch.'],
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
      ['Beta availability', 'The beta may change while we improve it. We will give notice when a new policy version needs acknowledgment.'],
      ['Governing details', 'Production legal terms, controller contact, retention schedule, and verification approach require counsel approval before broad production positioning.'],
    ],
  },
} as const;

export function privacyContact() {
  return process.env.PRIVACY_CONTACT_EMAIL?.trim() || 'Privacy contact pending publication before production launch.';
}

