import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'

function secretsMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

/**
 * Gate for development-only routes.
 *
 * - Hard-disabled in Production: returns 404 so the routes are
 *   indistinguishable from not existing.
 * - Requires the secret in the `x-dev-secret` HEADER — never a query
 *   parameter, which would leak into access logs and browser history.
 * - Fails closed if DEV_SECRET is unset.
 *
 * Returns null when access is allowed, or the response to send back.
 */
export function requireDevAccess(req: Request): NextResponse | null {
  if (process.env.VERCEL_ENV === 'production') {
    return new NextResponse(null, { status: 404 })
  }

  const secret = process.env.DEV_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'DEV_SECRET is not configured — dev routes are disabled' },
      { status: 403 }
    )
  }

  const provided = req.headers.get('x-dev-secret')
  if (!provided || !secretsMatch(provided, secret)) {
    return NextResponse.json({ error: 'Invalid or missing x-dev-secret header' }, { status: 401 })
  }

  return null
}
