'use client';

import { useState, useTransition } from 'react';
import { deleteObservation, deleteObservationMedia, editObservation } from '@/lib/observation-actions';
import { resolveAnonymousEntry } from '@/lib/account-actions';
import type { MilestoneStatus, ObservationMedia } from '@/lib/types';

export function TimelineObservationControls({ responseId, status, note, media, canManage, anonymous }: { responseId: string; status: MilestoneStatus; note?: string | null; media: ObservationMedia[]; canManage: boolean; anonymous: boolean }) {
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();
  if (!canManage && !anonymous) return null;
  const run = (task: () => Promise<{ ok: boolean; error?: string }>, success: string) => startTransition(async () => { const result = await task(); setMessage(result.ok ? success : result.error ?? 'Could not complete that request.'); if (result.ok) setEditing(false); });
  return <div className="timeline-controls">
    {canManage ? (editing ? <form className="inline-form" action={(formData) => run(() => editObservation({ responseId, status: String(formData.get('status')) as MilestoneStatus, note: String(formData.get('note') ?? '') }), 'Observation updated.') }>
      <select name="status" defaultValue={status} aria-label="Observation status"><option value="yes">Yes</option><option value="almost">Almost</option><option value="not_yet">Not yet</option></select><input name="note" defaultValue={note ?? ''} maxLength={2000} aria-label="Observation note" /><button className="button button-secondary" type="submit" disabled={pending}>Save</button><button className="button button-quiet" type="button" onClick={() => setEditing(false)}>Cancel</button>
    </form> : <div className="inline-form"><button className="button button-quiet" type="button" onClick={() => setEditing(true)}>Edit</button><button className="button button-quiet" type="button" disabled={pending} onClick={() => { if (window.confirm('Delete this observation and its photos permanently?')) run(() => deleteObservation(responseId), 'Observation deleted.'); }}>Delete</button></div>) : null}
    {canManage && media.length ? <div className="muted">{media.map((item) => <button className="button button-quiet" type="button" key={item.id} disabled={pending} onClick={() => { if (window.confirm('Remove this photo permanently?')) run(() => deleteObservationMedia(item.id), 'Photo removed.'); }}>Remove photo</button>)}</div> : null}
    {anonymous ? <div className="inline-form"><span className="muted">This entry is anonymous and will expire unless you choose.</span><button className="button button-secondary" type="button" disabled={pending} onClick={() => run(() => resolveAnonymousEntry({ responseId, decision: 'retain' }), 'Entry retained.')}>Keep</button><button className="button button-quiet" type="button" disabled={pending} onClick={() => { if (window.confirm('Delete this anonymous entry permanently?')) run(() => resolveAnonymousEntry({ responseId, decision: 'delete' }), 'Entry deleted.'); }}>Delete</button></div> : null}
    {message ? <span className="muted" role="status">{message}</span> : null}
  </div>;
}
