// CORS configuration for CTCE Hall Portal Edge Functions
// Strictly reads ALLOWED_ORIGIN secret with exact match (NEVER '*')

import { requireEnv } from './env.ts';

export function getCorsHeaders(): Record<string, string> {
  const allowedOrigin = requireEnv('ALLOWED_ORIGIN');
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
  };
}

// Proxy object for backwards-compatibility with `{ ...corsHeaders }` imports
export const corsHeaders: Record<string, string> = new Proxy({} as Record<string, string>, {
  get(_target, prop: string) {
    const headers = getCorsHeaders();
    return headers[prop];
  },
  ownKeys() {
    return Reflect.ownKeys(getCorsHeaders());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return {
      value: (getCorsHeaders() as any)[prop],
      writable: false,
      enumerable: true,
      configurable: true
    };
  }
});

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders() });
  }
  return null;
}
