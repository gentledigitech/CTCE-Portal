/**
 * Server-side input validation for Edge Functions
 */

export function validatePhoneServer(phone: string): { isValid: boolean; normalized?: string } {
  if (!phone) return { isValid: false };
  const cleaned = phone.trim().replace(/[\s\-()]/g, '');

  let e164 = '';
  if (cleaned.startsWith('+233')) {
    e164 = cleaned;
  } else if (cleaned.startsWith('233')) {
    e164 = `+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    e164 = `+233${cleaned.slice(1)}`;
  } else {
    return { isValid: false };
  }

  const ghanaRegex = /^\+233(2[03-9]|5[03-9])\d{7}$/;
  if (!ghanaRegex.test(e164)) {
    return { isValid: false };
  }
  return { isValid: true, normalized: e164 };
}

export function validateStudentIdServer(id: string): { isValid: boolean; normalized?: string } {
  if (!id) return { isValid: false };
  const trimmed = id.trim().toUpperCase();
  const regex = /^CTCE\/[A-Z]{3}\/\d{2}\/0\d{3}$/;
  if (!regex.test(trimmed)) {
    return { isValid: false };
  }
  return { isValid: true, normalized: trimmed };
}
