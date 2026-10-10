import type { IncomingMessage, ServerResponse } from 'http';

interface SendSmsRequestBody {
  recipient?: string;
  message?: string;
  sender?: string;
  kind?: string;
}

export default async function handler(req: any, res: any) {
  // CORS configuration for Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'healthy',
      endpoint: '/api/send-sms',
      platform: 'Vercel Serverless Function',
      configured: Boolean(process.env.ARKESEL_API_KEY || process.env.VITE_ARKESEL_API_KEY)
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body: SendSmsRequestBody = req.body;
    // Parse body if received as raw string
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: 'Invalid JSON payload' });
      }
    }

    const { recipient, message, sender, kind } = body || {};

    if (!recipient || !message) {
      return res.status(400).json({ error: 'Recipient phone number and message content are required.' });
    }

    const apiKey = process.env.ARKESEL_API_KEY || process.env.VITE_ARKESEL_API_KEY;
    const senderId = (sender || process.env.ARKESEL_SENDER_ID || 'CTCE SRC').slice(0, 11);

    if (!apiKey) {
      console.warn('[Vercel SMS] ARKESEL_API_KEY is not configured in Vercel environment variables.');
      return res.status(500).json({
        error: 'ARKESEL_API_KEY environment variable is not configured on Vercel deployment. Please add ARKESEL_API_KEY in Vercel Project Settings > Environment Variables.'
      });
    }

    // Normalize recipient format
    let digits = recipient.replace(/\D/g, '');
    if (digits.startsWith('0') && digits.length === 10) {
      digits = '233' + digits.slice(1);
    } else if (digits.startsWith('2330') && digits.length === 13) {
      digits = '233' + digits.slice(4);
    } else if (!digits.startsWith('233') && digits.length === 9) {
      digits = '233' + digits;
    }

    console.log(`[Vercel SMS] Dispatching to ${digits} (Sender: ${senderId}, Kind: ${kind || 'general'})`);

    const arkeselResponse = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: senderId,
        recipients: [digits],
        message: message.trim()
      })
    });

    const data = await arkeselResponse.json().catch(() => ({}));

    if (arkeselResponse.ok && data.status === 'success') {
      console.log(`[Vercel SMS] Successfully dispatched to ${digits}:`, data);
      return res.status(200).json({ success: true, data });
    } else {
      console.error(`[Vercel SMS] Arkesel returned error for ${digits}:`, data);
      return res.status(arkeselResponse.status || 400).json({
        error: data.message || 'SMS delivery failed with provider',
        details: data
      });
    }
  } catch (err: any) {
    console.error('[Vercel SMS] Exception during send-sms:', err);
    return res.status(500).json({ error: err.message || 'Internal server error while sending SMS' });
  }
}
