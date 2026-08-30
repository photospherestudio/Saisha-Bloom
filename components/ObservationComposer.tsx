'use client';

import { ChangeEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { MilestoneStatus } from '@/lib/types';
import { createObservationUploadTargets, registerObservationMedia, saveMilestoneResponse } from '@/lib/actions';

type PendingMedia = { file: File; preview: string };

export function ObservationComposer({ childId, milestoneId, status, demoMode = false, onSaved }: { childId: string; milestoneId: string; status: MilestoneStatus; demoMode?: boolean; onSaved?: () => void }) {
  const [note, setNote] = useState('');
  const [media, setMedia] = useState<PendingMedia[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function chooseMedia(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length + media.length > 3) { setMessage('Choose up to three photos.'); return; }
    const allowed = files.filter((file) => ['image/jpeg', 'image/png', 'image/webp', 'image/heic'].includes(file.type) && file.size <= 10 * 1024 * 1024);
    if (allowed.length !== files.length) { setMessage('Use JPG, PNG, WebP, or HEIC photos under 10 MB each.'); return; }
    setMessage(null);
    setMedia((current) => [...current, ...allowed.map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
  }

  async function save() {
    if (demoMode) { setMessage('Demo mode does not save memories. Sign in to keep this moment.'); return; }
    setPending(true);
    setMessage(null);
    try {
      const result = await saveMilestoneResponse({ childId, milestoneId, status, note: note.trim() });
      if (!result.ok || !result.responseId) throw new Error(result.error ?? 'Observation could not be saved.');
      const observationId = result.responseId;
      const targets = media.length ? await createObservationUploadTargets({ childId, responseId: observationId, files: media.map(({ file }) => ({ mimeType: file.type, sizeBytes: file.size })) }) : null;
      if (targets && (!targets.ok || !targets.uploads)) throw new Error(targets.error ?? 'Photo upload could not start.');
      const uploaded: { objectPath: string; mimeType: string; sizeBytes: number }[] = [];
      for (const [index, item] of media.entries()) {
        const target = targets!.uploads[index];
        const { error } = await createClient().storage.from(process.env.NEXT_PUBLIC_SUPABASE_IMAGE_BUCKET ?? 'milestone-memories').uploadToSignedUrl(target.objectPath, target.token, item.file);
        if (error) throw error;
        uploaded.push({ objectPath: target.objectPath, mimeType: item.file.type, sizeBytes: item.file.size });
      }
      if (uploaded.length) {
        const registered = await registerObservationMedia({ childId, responseId: observationId, uploads: uploaded });
        if (!registered.ok) throw new Error(registered.error ?? 'Photo could not be attached.');
      }
      setNote('');
      setMedia([]);
      setMessage('Memory saved to your timeline.');
      onSaved?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Memory could not be saved.');
    } finally { setPending(false); }
  }

  return (
    <div className="observation-composer">
      <label className="field-label" htmlFor={`note-${milestoneId}`}>Add context <span className="muted">(optional)</span></label>
      <textarea id={`note-${milestoneId}`} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Sipped from cup during lunch…" rows={3} />
      <div className="composer-actions">
        <label className="button button-secondary upload-button"><input type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple onChange={chooseMedia} />Add photos <span className="muted">{media.length}/3</span></label>
        <button className="button button-primary" type="button" onClick={() => void save()} disabled={pending}>{pending ? 'Saving…' : 'Save memory'}</button>
      </div>
      {media.length ? <div className="upload-previews">{media.map((item) => <img src={item.preview} alt="Selected memory preview" key={item.preview} />)}</div> : null}
      {message ? <p className="form-status" aria-live="polite">{message}</p> : null}
    </div>
  );
}
