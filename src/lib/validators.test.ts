import {
  validateGhanaPhone,
  validateStudentId,
  validateFullName,
  maskPhoneNumber
} from './validators.ts';

// Self-contained test suite runner
export function runValidatorTests(): { passed: number; failed: number; errors: string[] } {
  const errors: string[] = [];
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      passed++;
    } else {
      failed++;
      errors.push(msg);
      console.error(`[FAIL]: ${msg}`);
    }
  }

  // --- Phone Validator Tests ---
  const validPhones = [
    { input: '0241234567', expected: '+233241234567' },
    { input: '0509876543', expected: '+233509876543' },
    { input: '233241234567', expected: '+233241234567' },
    { input: '+233241234567', expected: '+233241234567' },
    { input: '020 123 4567', expected: '+233201234567' },
    { input: '055-123-4567', expected: '+233551234567' },
    { input: '0590001122', expected: '+233590001122' },
  ];

  validPhones.forEach(({ input, expected }) => {
    const res = validateGhanaPhone(input);
    assert(res.isValid && res.normalized === expected, `Phone ${input} should normalize to ${expected}`);
  });

  const invalidPhones = [
    '0123456789', // 01 is not a mobile prefix in Ghana
    '0211234567', // 021 was landline (now 030), not mobile
    '024123456',  // Too short
    '024123456789', // Too long
    'abcdefghij', // Non-numeric
    '',           // Empty
    '12345'
  ];

  invalidPhones.forEach((input) => {
    const res = validateGhanaPhone(input);
    assert(!res.isValid, `Phone "${input}" should be invalid`);
  });

  // --- Trainee / Student ID Validator Tests ---
  const validIds = [
    { input: 'CTCE/BEE/25/0123', expected: 'CTCE/BEE/25/0123', level: 200 },
    { input: 'ctce/bed/24/0045', expected: 'CTCE/BED/24/0045', level: 300 },
    { input: 'CTCE/ECE/23/0890', expected: 'CTCE/ECE/23/0890', level: 400 },
    { input: 'CTCE/MAT/26/0001', expected: 'CTCE/MAT/26/0001', level: 100 },
  ];

  validIds.forEach(({ input, expected, level }) => {
    const res = validateStudentId(input);
    assert(res.isValid && res.normalized === expected && res.level === level, `ID ${input} should be valid for level ${level}`);
  });

  const invalidIds = [
    'CTCE/BEE/25/123', // Missing leading zero in 0XXX
    'CTCE/BEE/2025/0123', // 4 digit year
    'UCC/BEE/25/0123', // Not CTCE
    'CTCE/BE/25/0123', // Only 2 letter program
    'CTCE/BEE/25/01234', // 5 digits
    'invalid-id',
    ''
  ];

  invalidIds.forEach((input) => {
    const res = validateStudentId(input);
    assert(!res.isValid, `ID "${input}" should be invalid`);
  });

  // --- Full Name Tests ---
  const validNames = [
    'Kofi Mensah',
    'Abena Osei-Tutu',
    'Mary Jane D\'Souza',
    'Kwame Johnathan Doe-Smith the Third'
  ];

  validNames.forEach((input) => {
    const res = validateFullName(input);
    assert(res.isValid, `Name "${input}" should be valid`);
    assert(Boolean(res.smsTruncated && res.smsTruncated.length <= 30), `Name SMS truncated should be <= 30 chars`);
  });

  const invalidNames = [
    'A', // Too short
    'Kofi123', // Contains numbers
    'Kwame@ghana', // Special character
    ''
  ];

  invalidNames.forEach((input) => {
    const res = validateFullName(input);
    assert(!res.isValid, `Name "${input}" should be invalid`);
  });

  // --- Phone Masking Tests ---
  const masked = maskPhoneNumber('+233241234578');
  assert(masked === '+233 24 *** **78', `Masked phone should match +233 24 *** **78, got ${masked}`);

  return { passed, failed, errors };
}
