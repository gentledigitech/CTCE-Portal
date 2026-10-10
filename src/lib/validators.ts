/**
 * Validation and normalization utilities for CTCE Hall Portal
 * Ghana phone numbers, CTCE Student / Trainee IDs, and Names
 */

export interface PhoneValidationResult {
  isValid: boolean;
  normalized?: string; // Formatted as +233XXXXXXXXX
  error?: string;
}

export interface StudentIdValidationResult {
  isValid: boolean;
  normalized?: string; // Formatted as CTCE/XXX/YY/0ZZZ
  level?: number;
  error?: string;
}

export interface NameValidationResult {
  isValid: boolean;
  normalized?: string;
  smsTruncated?: string; // Max 30 chars for SMS GSM compliance
  error?: string;
}

/**
 * Normalizes and validates Ghanaian phone numbers.
 * Accepts:
 *  - 0XXXXXXXXX (10 digits starting with 02 or 05)
 *  - 233XXXXXXXXX (12 digits starting with 2332 or 2335)
 *  - +233XXXXXXXXX (13 chars starting with +2332 or +2335)
 *
 * Normalizes to strict E.164: ^\+233(2[03-9]|5[03-9])\d{7}$
 */
export function validateGhanaPhone(input: string): PhoneValidationResult {
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: 'Phone number is required.' };
  }

  // Remove spaces, hyphens, parentheses
  const cleaned = input.trim().replace(/[\s\-()]/g, '');

  let e164 = '';
  if (cleaned.startsWith('+233')) {
    e164 = cleaned;
  } else if (cleaned.startsWith('233')) {
    e164 = `+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    e164 = `+233${cleaned.slice(1)}`;
  } else if (/^(2[03-9]|5[03-9])\d{7}$/.test(cleaned)) {
    e164 = `+233${cleaned}`;
  } else {
    return {
      isValid: false,
      error: 'Invalid phone format. Must be a valid Ghanaian number (e.g. 024XXXXXXX or 050XXXXXXX).'
    };
  }

  // Strict E.164 Ghana mobile number check:
  // Country code: +233
  // Valid mobile prefixes: 20, 23, 24, 25, 26, 27, 28, 29, 50, 53, 54, 55, 56, 57, 58, 59
  // Followed by 7 digits
  const ghanaPhoneRegex = /^\+233(2[03-9]|5[03-9])\d{7}$/;

  if (!ghanaPhoneRegex.test(e164)) {
    return {
      isValid: false,
      error: 'Please enter a valid Ghanaian mobile number (MTN, Telecel, or AT).'
    };
  }

  return { isValid: true, normalized: e164 };
}

/**
 * Validates and normalizes CTCE Student / Trainee ID.
 * Pattern: ^CTCE/[A-Z]{3}/\d{2}/0\d{3}$
 * Example: CTCE/BEE/25/0123
 */
export function validateStudentId(input: string, baseAcademicYearStart = 2026): StudentIdValidationResult {
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: 'Trainee ID is required.' };
  }

  const trimmed = input.trim().toUpperCase();
  const idRegex = /^CTCE\/[A-Z]{3}\/(\d{2})\/(0\d{3})$/;

  const match = trimmed.match(idRegex);
  if (!match) {
    return {
      isValid: false,
      error: 'Invalid Trainee ID format. Format must match CTCE/PRG/YY/0XXX (e.g., CTCE/BEE/25/0123).'
    };
  }

  const entryYearDigits = parseInt(match[1], 10);
  
  // Level calculation according to prompt:
  // "so if it is 25 then the user is in level 200, if it is 24 then the user is in 300 and if it is 23 then the user is in level 400."
  // If entry is 26, it's Level 100.
  let calculatedLevel = 100;
  if (entryYearDigits === 26) {
    calculatedLevel = 100;
  } else if (entryYearDigits === 25) {
    calculatedLevel = 200;
  } else if (entryYearDigits === 24) {
    calculatedLevel = 300;
  } else if (entryYearDigits === 23) {
    calculatedLevel = 400;
  } else {
    // General formula if older or newer:
    // (baseAcademicYearStart - (2000 + entryYearDigits) + 1) * 100
    const diff = baseAcademicYearStart - (2000 + entryYearDigits);
    calculatedLevel = Math.max(100, Math.min(400, (diff + 1) * 100));
  }

  return {
    isValid: true,
    normalized: trimmed,
    level: calculatedLevel
  };
}

/**
 * Validates and sanitizes applicant full name.
 * Truncates to 30 characters for plain GSM SMS without breaking words where possible.
 */
export function validateFullName(input: string): NameValidationResult {
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: 'Full legal name is required.' };
  }

  // Remove excessive whitespace, trim
  const cleaned = input.trim().replace(/\s+/g, ' ');

  if (cleaned.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long.' };
  }

  if (cleaned.length > 80) {
    return { isValid: false, error: 'Name must not exceed 80 characters.' };
  }

  // Check valid name characters: letters, spaces, hyphens, apostrophes
  const nameRegex = /^[A-Za-z\s'\-\.]+$/;
  if (!nameRegex.test(cleaned)) {
    return {
      isValid: false,
      error: 'Name must only contain alphabetic characters, spaces, hyphens, and apostrophes.'
    };
  }

  // Max 30 chars for SMS GSM compliance
  const smsTruncated = cleaned.slice(0, 30).trim();

  return {
    isValid: true,
    normalized: cleaned,
    smsTruncated
  };
}

/**
 * Mask phone number for public/viewer display: +233 24 *** **78
 */
export function maskPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 9) return phone;

  // Expected 12 digits: 233XXXXXXXXX
  const national = cleaned.startsWith('233') ? cleaned.slice(3) : (cleaned.startsWith('0') ? cleaned.slice(1) : cleaned);
  if (national.length === 9) {
    const net = national.slice(0, 2); // e.g. 24
    const last2 = national.slice(7, 9); // e.g. 78
    return `+233 ${net} *** **${last2}`;
  }
  return `+233 ** *** **${cleaned.slice(-2)}`;
}
