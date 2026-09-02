'use client';

import { useEffect, useState } from 'react';

export function ConfirmDialog({ title, message, phrase, password, onCancel, onConfirm }: { title: string; message: string; phrase?: string; password?: boolean; onCancel: () => void; onConfirm: (phrase: string, password: string) => void }) {
  const [typed, setTyped] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const ready = (!phrase || typed.trim().toUpperCase() === phrase) && (!password || currentPassword.length > 0);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onCancel]);
  return <div className="modal-backdrop" role="presentation"><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message"><h2 id="confirm-title">{title}</h2><p id="confirm-message">{message}</p>{phrase ? <div className="field"><label htmlFor="confirm-phrase">Type {phrase} to continue</label><input id="confirm-phrase" autoFocus value={typed} onChange={(event) => setTyped(event.target.value)} /></div> : null}{password ? <div className="field"><label htmlFor="confirm-password">Current password</label><input id="confirm-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></div> : null}<div className="modal-actions"><button className="button button-quiet" type="button" onClick={onCancel}>Cancel</button><button className="button button-primary" type="button" disabled={!ready} onClick={() => onConfirm(typed, currentPassword)}>Continue</button></div></section></div>;
}
