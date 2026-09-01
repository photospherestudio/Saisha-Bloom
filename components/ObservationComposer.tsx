'use client';

import { ChangeEvent, useState } from 'react';
import type { MilestoneStatus } from '@/lib/types';
import { abandonObservationUpload, finalizeObservation, prepareObservation } from '@/lib/observation-actions';
import { Upload } from 'tus-js-client';

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
      const prepared = await prepareObservation({ childId, milestoneId, status, note: note.trim(), files: media.map(({ file }) => ({ mimeType: file.type, sizeBytes: file.size })) });
      if (!prepared.ok || !prepared.responseId) throw new Error('error' in prepared ? prepared.error : 'Observation could not be prepared.');
      try {
        for (const [index, item] of media.entries()) {
          const target = prepared.uploads[index];
          await new Promise<void>((resolve, reject) => {
            // Supabase's resumable endpoint is pinned to a 6 MB TUS chunk as recommended by Storage.
            const tus = new Upload(item.file, { endpoint: prepared.endpoint, retryDelays: [0, 3000, 5000, 10000, 20000], chunkSize: 6 * 1024 * 1024, uploadDataDuringCreation: true, removeFingerprintOnSuccess: true, headers: { 'x-signature': target.token }, metadata: { bucketName: process.env.NEXT_PUBLIC_SUPABASE_IMAGE_BUCKET ?? 'milestone-memories', objectName: target.objectPath, contentType: item.file.type, cacheControl: '3600' }, onError: reject, onSuccess: () => resolve() });
            void tus.start();
          });
        }
        const finalized = await finalizeObservation({ childId, responseId: prepared.responseId });
        if (!finalized.ok) throw new Error('error' in finalized ? finalized.error : 'Observation could not be finalized.');
      } catch (uploadError) {
        await abandonObservationUpload({ childId, responseId: prepared.responseId });
        throw uploadError;
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
        <button className="button button-primary" type="button" onClick={() => void save()} disabled={pending}>{pending ? 'Saving…' : 'Save observation'}</button>
      </div>
      {media.length ? <div className="upload-previews">{media.map((item) => <img src={item.preview} alt="Selected memory preview" key={item.preview} />)}</div> : null}
      {message ? <p className="form-status" aria-live="polite">{message}</p> : null}
    </div>
  );
}
