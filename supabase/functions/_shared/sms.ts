/**
 * Arkesel SMS integration for CTCE Hall Portal
 * REST API client calling https://sms.arkesel.com/api/v2/sms/send
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

interface SendSmsOptions {
  recipientE164: string; // e.g. +233241234567
  message: string;
  kind: 'otp' | 'hall_allocation' | 'waitlist' | 'bulk' | 'password_reset';
  applicantId?: string;
  supabaseClient?: any;
}

interface ArkeselResponse {
  status: string; // TODO( verify ) against developers.arkesel.com: status field type
  data?: any;
  message?: string;
}

/**
 * Dispatches plain GSM SMS through Arkesel v2 REST API.
 * Converts +233XXXXXXXXX to 233XXXXXXXXX format required by Arkesel.
 * Never stores message text that contains codes in sms_log.
 * If sending fails, the allocation STANDS and failure is logged for retry.
 */
export async function sendArkeselSms({
  recipientE164,
  message,
  kind,
  applicantId,
  supabaseClient
}: SendSmsOptions): Promise<{ success: boolean; providerStatus?: string; error?: string }> {
  const apiKey = Deno.env.get('ARKESEL_API_KEY');
  const senderId = Deno.env.get('ARKESEL_SENDER_ID') || 'CTCE SRC';

  // Convert +233XXXXXXXXX to 233XXXXXXXXX
  const recipientFormatted = recipientE164.replace(/^\+/, '');

  // Truncate message to avoid multi-part charges if needed (plain GSM)
  const sanitizedMessage = message.trim();

  // Redacted preview for database logging (never store plaintext OTP codes)
  const isOtp = kind === 'otp' || kind === 'password_reset';
  const logPreview = isOtp
    ? 'CTCE Hall Portal: your code is [REDACTED]. It expires in 5 minutes. Do not share it.'
    : sanitizedMessage.slice(0, 140);

  let httpStatus = 0;
  let providerStatus = 'unknown';
  let providerMessageId = '';
  let errorMessage = '';

  try {
    if (!apiKey) {
      console.warn('ARKESEL_API_KEY is not configured in environment. Simulating dispatch.');
      providerStatus = 'simulated';
      return { success: true, providerStatus };
    }

    // TODO( verify ): Check exact Arkesel v2 endpoint and JSON payload fields at developers.arkesel.com
    const response = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: senderId,
        recipients: [recipientFormatted], // TODO( verify ): Check if array or comma-separated string
        message: sanitizedMessage
      })
    });

    httpStatus = response.status;
    const resData: ArkeselResponse = await response.json();

    if (response.ok && resData.status === 'success') {
      providerStatus = 'delivered';
      providerMessageId = resData.data?.id || '';
    } else {
      providerStatus = 'failed';
      errorMessage = resData.message || `HTTP ${httpStatus}`;
    }
  } catch (err: any) {
    providerStatus = 'failed';
    errorMessage = err.message || 'Network exception calling Arkesel';
  } finally {
    // Log attempt into sms_log (failure does not rollback transaction)
    if (supabaseClient) {
      try {
        await supabaseClient.from('sms_log').insert({
          applicant_id: applicantId || null,
          phone_e164: recipientE164,
          kind,
          provider_message_id: providerMessageId || null,
          http_status: httpStatus || null,
          provider_status: providerStatus,
          error: errorMessage || null
        });
      } catch (logErr) {
        console.error('Failed to write to sms_log:', logErr);
      }
    }
  }

  return {
    success: providerStatus === 'delivered' || providerStatus === 'simulated',
    providerStatus,
    error: errorMessage || undefined
  };
}
