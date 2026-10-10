/**
 * Strict Environment Configuration Helper
 * Removes fallback defaults for all secrets.
 * Throws a clear descriptive error if a required environment variable is missing or empty.
 */
export function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value || value.trim() === '') {
    throw new Error(`SECURITY CONFIGURATION ERROR: Required environment variable '${name}' is not set or empty.`);
  }
  return value.trim();
}
