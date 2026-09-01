'use client';

import { useState } from 'react';

export function StorybookExport({ childId, observations }: { childId: string; observations: Array<{ id: string; title: string; date: string }> }) {
  const [password, setPassword] = useState('');
  const [selected, setSelected] = useState<string[]>(observations.slice(0, 24).map((item) => item.id));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    try { const response = await fetch(`/api/children/${childId}/storybook`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: window.location.origin }, body: JSON.stringify({ password, observationIds: selected }) }); if (!response.ok) throw new Error(await response.text() || 'Could not create storybook.'); const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'milestone-storybook.pdf'; link.click(); URL.revokeObjectURL(url); setMessage('Your storybook is ready.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not create storybook.'); } finally { setBusy(false); }
  }
  return <form className="form-card" onSubmit={submit}><div className="field"><span className="muted">Moments ({selected.length}/24)</span>{observations.length ? observations.map((item) => <label key={item.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={selected.includes(item.id)} disabled={!selected.includes(item.id) && selected.length >= 24} onChange={() => setSelected((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} />{item.title} · {new Date(item.date).toLocaleDateString('en-IN')}</label>) : <span className="muted">No observations from the last year yet.</span>}</div><div className="field"><label htmlFor="storybook-password">Current password</label><input id="storybook-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div><button className="button button-primary" type="submit" disabled={busy || selected.length === 0}>{busy ? 'Making your storybook…' : 'Download private storybook'}</button>{message ? <p className="form-status" role="status">{message}</p> : null}</form>;
}
