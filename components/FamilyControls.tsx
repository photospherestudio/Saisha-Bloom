'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import type { FamilyMember, PendingInvite } from '@/lib/types';
import type { ReminderPreference } from './saisha-ui';
import { createCaregiverInvite, revokeCaregiverAccess } from '@/lib/actions';
import { setReminderChannels } from '@/lib/push-actions';

export function FamilyControls({ childId, preference, relationship = 'owner', members = [], pendingInvites = [] }: { childId: string; preference?: ReminderPreference | null; relationship?: 'owner' | 'editor'; members?: FamilyMember[]; pendingInvites?: PendingInvite[] }) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [channels, setChannels] = useState({ email: Boolean(preference?.emailCheckpointEnabled ?? preference?.enabled), push: Boolean(preference?.pushCheckpointEnabled), caregiver: Boolean(preference?.caregiverActivityEnabled) });
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);
  const [memberList, setMemberList] = useState(members);
  const [pending, setPending] = useState(false);
  const isOwner = relationship === 'owner';

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setInviteMessage(null);
    try {
      const result = await createCaregiverInvite({ childId, email: inviteEmail });
      if (!result.ok) throw new Error('error' in result ? result.error : 'Invite could not be sent.');
      setInviteEmail('');
      setInviteMessage('Invite sent. They can join this child’s space from their email.');
    } catch (error) {
      setInviteMessage(error instanceof Error ? error.message : 'Invite could not be sent.');
    } finally { setPending(false); }
  }

  async function toggleReminder(channel: 'email' | 'push' | 'caregiver') {
    const next = { ...channels, [channel]: !channels[channel] };
    setPending(true);
    setReminderMessage(null);
    try {
      const result = await setReminderChannels({ childId, emailCheckpointEnabled: next.email, pushCheckpointEnabled: next.push, caregiverActivityEnabled: next.caregiver });
      if (!result.ok) throw new Error('error' in result ? result.error : 'Reminder setting could not be saved.');
      setChannels(next);
      setReminderMessage('Notification preferences saved.');
    } catch (error) {
      setReminderMessage(error instanceof Error ? error.message : 'Reminder setting could not be saved.');
    } finally { setPending(false); }
  }

  return (
    <section className="utility-grid" aria-label="Family tools">
      <div className="utility-card">
        <div className="eyebrow">Share the noticing</div>
        <h2>Bring your people in.</h2>
        <p className="muted">{isOwner ? `Invite a co-parent, sitter, or grandparent to add observations to this child’s shared story.` : 'You can add observations. Profile sharing is managed by the owner.'}</p>
        {isOwner ? <form className="inline-form" onSubmit={invite}>
          <label className="sr-only" htmlFor="invite-email">Caregiver email</label>
          <input id="invite-email" type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="caregiver@example.com" required />
          <button className="button button-secondary" type="submit" disabled={pending}>Invite</button>
        </form> : null}
        {inviteMessage ? <p className="form-status" aria-live="polite">{inviteMessage}</p> : null}
        {isOwner ? <Link className="source-link" href={`/invite?childId=${childId}`}>Have an invite? Accept it ↗</Link> : null}
        {memberList.length ? <div className="family-members"><strong>Caregivers</strong>{memberList.map((member) => <div className="family-member" key={member.id}><span>{member.email}</span>{isOwner ? <button className="button-quiet" type="button" onClick={async () => { const result = await revokeCaregiverAccess({ childId, email: member.email }); if (result.ok) setMemberList((current) => current.filter((item) => item.id !== member.id)); }}>Remove</button> : null}</div>)}</div> : null}
        {isOwner && pendingInvites.length ? <p className="muted family-pending">Pending: {pendingInvites.map((invite) => invite.email).join(', ')}</p> : null}
      </div>
      <div className="utility-card">
        <div className="eyebrow">A gentle nudge</div>
        <h2>Keep it easy to remember.</h2>
        <p className="muted">Each channel is optional and starts off. Messages never include child names, notes, photos, or milestone states.</p>
        <div className="field"><label><input type="checkbox" checked={channels.email} onChange={() => void toggleReminder('email')} disabled={pending} /> Email guidepost check-ins</label><label><input type="checkbox" checked={channels.push} onChange={() => void toggleReminder('push')} disabled={pending} /> Push guidepost check-ins</label><label><input type="checkbox" checked={channels.caregiver} onChange={() => void toggleReminder('caregiver')} disabled={pending} /> Caregiver activity updates</label></div>
        {reminderMessage ? <p className="form-status" aria-live="polite">{reminderMessage}</p> : null}
      </div>
    </section>
  );
}
