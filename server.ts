import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Server-side Arkesel SMS Dispatch Route
  app.post('/api/send-sms', async (req, res) => {
    try {
      const { recipient, message, sender, kind } = req.body;
      if (!recipient || !message) {
        return res.status(400).json({ error: 'Recipient phone number and message content are required.' });
      }

      const apiKey = process.env.ARKESEL_API_KEY;
      const senderId = (sender || process.env.ARKESEL_SENDER_ID || 'CTCE SRC').slice(0, 11);

      if (!apiKey) {
        console.warn('[Server SMS] ARKESEL_API_KEY is not configured in server environment.');
        return res.status(500).json({ error: 'SMS service configuration is missing on server.' });
      }

      // Format recipient: normalize +233XXXXXXXXX, 0XXXXXXXXX, or +2330XXXXXXXXX to 233XXXXXXXXX
      let digits = recipient.replace(/\D/g, '');
      if (digits.startsWith('0') && digits.length === 10) {
        digits = '233' + digits.slice(1);
      } else if (digits.startsWith('2330') && digits.length === 13) {
        digits = '233' + digits.slice(4);
      } else if (!digits.startsWith('233') && digits.length === 9) {
        digits = '233' + digits;
      }

      console.log(`[Server SMS] Dispatching to ${digits} (Sender: ${senderId}, Kind: ${kind || 'general'})`);

      const response = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
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

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.status === 'success') {
        console.log(`[Server SMS] Successfully sent to ${digits}:`, data);
        return res.json({ success: true, data });
      } else {
        console.error(`[Server SMS] Arkesel API error for ${digits}:`, data);
        return res.status(response.status || 400).json({
          error: data.message || 'SMS provider delivery failed',
          details: data
        });
      }
    } catch (err: any) {
      console.error('[Server SMS] Exception while sending SMS:', err);
      return res.status(500).json({ error: err.message || 'Server error sending SMS' });
    }
  });

  // Mount Vite dev server in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static frontend build in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CTCE Portal Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
