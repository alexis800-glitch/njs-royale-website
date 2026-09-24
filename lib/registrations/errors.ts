/**
 * A coarse, safe label for an error, for operational logs.
 *
 * Postgres and Node put a stable machine code on their errors — SQLSTATE values
 * like `42P01` (undefined table) or `28P01` (bad password), and system codes like
 * `ENOTFOUND` and `ECONNREFUSED`. Those say precisely what went wrong and contain
 * nothing sensitive, so they are what we log.
 *
 * The error *message* is never logged. A database message can quote the offending
 * row, and a connection message can carry the host and user, so messages are the
 * one thing that could turn a log line into a data leak.
 */
export function errorCategory(error: unknown): string {
  if (error && typeof error === 'object') {
    const code = (error as { code?: unknown }).code
    if (typeof code === 'string' && code) return code
    if (typeof code === 'number') return String(code)
  }
  return error instanceof Error && error.name ? error.name : 'unknown'
}
