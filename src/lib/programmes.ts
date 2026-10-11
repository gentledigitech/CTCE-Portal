/**
 * The programmes a student can choose from.
 * Keep this list the same as allowed_programmes() in the database (stage2b_database.sql).
 */
export const PROGRAMMES = [
  'Bachelor of Education (Junior High School)',
  'Bachelor of Education (Primary)',
  'Bachelor of Education (Early Childhood)'
] as const;

export type Programme = (typeof PROGRAMMES)[number];
