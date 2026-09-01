'use client';

import { useEffect, useState } from 'react';

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

export function InstallPrompt() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallEvent);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !navigatorWithStandalone.standalone) setShowIosHelp(true);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  if (!prompt && !showIosHelp) return null;

  return (
    <aside className="install-prompt" aria-label="Install Saisha Bloom">
      <strong>Keep Saisha Bloom close</strong>
      <p>{showIosHelp ? 'On iPhone or iPad, use Share, then Add to Home Screen.' : 'Install the public welcome and demo for easier access.'}</p>
      {prompt ? <button className="button button-secondary" type="button" onClick={() => void prompt.prompt().then(() => setPrompt(null))}>Install app</button> : null}
      {!prompt ? <button className="button button-quiet" type="button" onClick={() => setShowIosHelp(false)}>Got it</button> : null}
    </aside>
  );
}
