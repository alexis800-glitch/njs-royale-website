import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { webhookEvents } from '@/lib/db/schema'
import { classifyPayload, processWebhook } from '@/lib/aiosell/processWebhook'
import type { AiosellWebhookPayload, WebhookEventType } from '@/lib/aiosell/types'

export const dynamic = 'force-dynamic'

function successMessage(eventType: WebhookEventType): string {
  switch (eventType) {
    case 'rates':
    case 'rate_restrictions':
      return 'Rates Updated Successfully'
    case 'inventory':
    case 'inventory_restrictions':
      return 'Inventory Updated Successfully'
    default:
      return 'Update Received'
  }
}

/**
 * Single receiver for all four Aiosell push types (inventory, rates,
 * inventory restrictions, rate restrictions) — Aiosell POSTs everything to
 * the one base URL registered with them; the payload shape decides the type.
 *
 * Contract: the raw payload is persisted to webhook_events BEFORE any
 * parsing/processing, and processing failures still return HTTP 200 so
 * Aiosell does not treat a local bug as a delivery failure. Only a failure
 * to persist the event returns 500 (Aiosell should retry those).
 */
export async function POST(req: Request) {
  // TODO: webhook verification — Aiosell confirmed Basic Auth; pending production enforcement/configuration

  const rawText = await req.text()
  const headers = Object.fromEntries(req.headers.entries())

  let payload: AiosellWebhookPayload | null = null
  let parseError: string | null = null
  try {
    payload = JSON.parse(rawText)
  } catch (err) {
    parseError = `JSON parse failed: ${err instanceof Error ? err.message : String(err)}`
  }

  const eventType: WebhookEventType = payload ? classifyPayload(payload) : 'unknown'

  // 1. Persist the raw event first — if anything downstream fails, the
  //    payload is never lost.
  let eventId: number
  try {
    const db = getDb()
    const inserted = await db
      .insert(webhookEvents)
      .values({
        eventType,
        rawPayload: payload ?? { unparsedBody: rawText },
        headers,
        processed: false,
        processingError: parseError,
      })
      .returning({ id: webhookEvents.id })
    eventId = inserted[0].id
  } catch (err) {
    // Could not even store the event — this is the one case worth a 500 so
    // Aiosell retries the delivery.
    console.error('aiosell webhook: failed to persist event', err)
    return NextResponse.json(
      { success: false, message: 'Failed to store update' },
      { status: 500 }
    )
  }

  if (!payload || eventType === 'unknown') {
    return NextResponse.json({ success: true, message: successMessage(eventType) })
  }

  // 2. Process. Failures are recorded on the stored event and still ack 200.
  try {
    const db = getDb()
    const result = await processWebhook(db, eventType, payload)
    await db
      .update(webhookEvents)
      .set({
        processed: true,
        processingError: result.warnings.length > 0 ? result.warnings.join('; ') : null,
      })
      .where(eq(webhookEvents.id, eventId))
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`aiosell webhook: processing failed for event ${eventId}`, err)
    try {
      await getDb()
        .update(webhookEvents)
        .set({ processed: false, processingError: message })
        .where(eq(webhookEvents.id, eventId))
    } catch (updateErr) {
      console.error(`aiosell webhook: failed to record error on event ${eventId}`, updateErr)
    }
  }

  return NextResponse.json({ success: true, message: successMessage(eventType) })
}
