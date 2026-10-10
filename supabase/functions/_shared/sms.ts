/**
 * Arkesel SMS integration for CTCE Hall Portal
 * REST API client calling https://sms.arkesel.com/api/v2/sms/send
 */

import { requireEnv } from './env.ts';

interface SendSmsOptions {
  recipientE164: string; // e.g. +233241234567
  message: string;
  kind: 'otp' | 'hall_allocation' | 'waitlist' | 'bulk' | 'password_reset';
  applicantId?: string;
  supabaseClient?: any;
}

interface ArkeselResponse {
  status: string;
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
  // Strictly require environment variables without fallback defaults
  const apiKey = requireEnv('ARKESEL_API_KEY');
  const senderId = requireEnv('ARKESEL_SENDER_ID');

  // Convert +233XXXXXXXXX to 233XXXXXXXXX
  const recipientFormatted = recipientE164.replace(/^\+/, '');

  // Truncate message to avoid multi-part charges if needed (plain GSM)
  const sanitizedMessage = message.trim();

  let httpStatus = 0;
  let providerStatus = 'unknown';
  let providerMessageId = '';
  let errorMessage = '';

  try {
    const response = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: senderId,
        recipients: [recipientFormatted],
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
    success: providerStatus === 'delivered',
    providerStatus,
    error: errorMessage || undefined
  };
}
