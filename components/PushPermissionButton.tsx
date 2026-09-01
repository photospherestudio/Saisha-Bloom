'use client';

import { useState } from 'react';
import { subscribePush, unsubscribePush } from '@/lib/push-actions';

export function PushPermissionButton() {
  const [message, setMessage] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  async function enable() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) { setMessage('Push notifications are not available on this device.'); return; }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') { setMessage('Push permission remains off.'); return; }
    const registration = await navigator.serviceWorker.ready;
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!key) { setMessage('Push notifications are not configured yet.'); return; }
    const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: Uint8Array.from(atob(key.replace(/-/g, '+').replace(/_/g, '/')), (char) => char.charCodeAt(0)) });
    const result = await subscribePush(subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } });
    if (result.ok) { setEnabled(true); setMessage('Push check-ins enabled.'); }
    else setMessage(result.error);
  }
  async function disable() { const registration = await navigator.serviceWorker.ready; const subscription = await registration.pushManager.getSubscription(); if (subscription) { await unsubscribePush(subscription.endpoint); await subscription.unsubscribe(); } setEnabled(false); setMessage('Push check-ins disabled.'); }
  return <div><button className="button button-secondary" type="button" onClick={() => void (enabled ? disable() : enable())}>{enabled ? 'Disable push check-ins' : 'Enable push check-ins'}</button>{message ? <p className="form-status" aria-live="polite">{message}</p> : null}</div>;
}
