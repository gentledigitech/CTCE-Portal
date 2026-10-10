import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';

/**
 * Cloudflare Turnstile "I am not a robot" check.
 * - Real mode: shows the widget and reports the one-time token through onToken.
 *   Needs VITE_TURNSTILE_SITE_KEY (the PUBLIC site key, never the secret key).
 * - Mock mode: renders nothing (the sign-up page does not ask for a token in mock mode).
 * Change resetKey to get a fresh token (a token only works once).
 */

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('Could not load the security check.'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

interface TurnstileWidgetProps {
  onToken: (token: string | null) => void;
  resetKey?: number;
}

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({ onToken, resetKey = 0 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (api.isMock() || !SITE_KEY) return;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme: 'auto',
          callback: (token: string) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(null),
          'error-callback': () => onTokenRef.current(null)
        });
      })
      .catch(() => setLoadFailed(true));

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* widget already gone */
        }
        widgetIdRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (resetKey === 0 || api.isMock()) return;
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        /* nothing to reset */
      }
    }
  }, [resetKey]);

  if (api.isMock()) return null;

  if (!SITE_KEY) {
    return (
      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
        The security check is not set up yet (missing VITE_TURNSTILE_SITE_KEY).
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
        The security check could not load. Please check your internet connection and refresh the page.
      </div>
    );
  }

  return <div ref={containerRef} className="flex justify-center min-h-[65px]" />;
};
