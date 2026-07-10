import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'

export const rooms = pgTable('rooms', {
  id: serial('id').primaryKey(),
  roomCode: text('room_code').notNull().unique(),
  name: text('name').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const ratePlans = pgTable('rate_plans', {
  id: serial('id').primaryKey(),
  rateplanCode: text('rateplan_code').notNull().unique(),
  roomId: integer('room_id')
    .notNull()
    .references(() => rooms.id),
  label: text('label').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const dailyRates = pgTable(
  'daily_rates',
  {
    id: serial('id').primaryKey(),
    ratePlanId: integer('rate_plan_id')
      .notNull()
      .references(() => ratePlans.id),
    date: date('date').notNull(),
    rate: numeric('rate', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('NGN'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    ratePlanDateUnique: unique('daily_rates_rate_plan_date_unique').on(t.ratePlanId, t.date),
  })
)

export const dailyInventory = pgTable(
  'daily_inventory',
  {
    id: serial('id').primaryKey(),
    roomId: integer('room_id')
      .notNull()
      .references(() => rooms.id),
    date: date('date').notNull(),
    available: integer('available').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    roomDateUnique: unique('daily_inventory_room_date_unique').on(t.roomId, t.date),
  })
)

// Room-level restrictions — from Aiosell "Inventory Restrictions" pushes.
export const roomRestrictions = pgTable(
  'room_restrictions',
  {
    id: serial('id').primaryKey(),
    roomId: integer('room_id')
      .notNull()
      .references(() => rooms.id),
    date: date('date').notNull(),
    stopSell: boolean('stop_sell').notNull().default(false),
    minimumStay: integer('minimum_stay'),
    maximumStay: integer('maximum_stay'),
    closeOnArrival: boolean('close_on_arrival').notNull().default(false),
    closeOnDeparture: boolean('close_on_departure').notNull().default(false),
    minimumStayArrival: integer('minimum_stay_arrival'),
    maximumStayArrival: integer('maximum_stay_arrival'),
    exactStayArrival: integer('exact_stay_arrival'),
    minimumAdvanceReservation: integer('minimum_advance_reservation'),
    maximumAdvanceReservation: integer('maximum_advance_reservation'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    roomDateUnique: unique('room_restrictions_room_date_unique').on(t.roomId, t.date),
  })
)

// Rateplan-level restrictions — from Aiosell "Rates Restrictions" pushes.
export const rateplanRestrictions = pgTable(
  'rateplan_restrictions',
  {
    id: serial('id').primaryKey(),
    ratePlanId: integer('rate_plan_id')
      .notNull()
      .references(() => ratePlans.id),
    date: date('date').notNull(),
    stopSell: boolean('stop_sell').notNull().default(false),
    minimumStay: integer('minimum_stay'),
    maximumStay: integer('maximum_stay'),
    closeOnArrival: boolean('close_on_arrival').notNull().default(false),
    closeOnDeparture: boolean('close_on_departure').notNull().default(false),
    minimumStayArrival: integer('minimum_stay_arrival'),
    maximumStayArrival: integer('maximum_stay_arrival'),
    exactStayArrival: integer('exact_stay_arrival'),
    minimumAdvanceReservation: integer('minimum_advance_reservation'),
    maximumAdvanceReservation: integer('maximum_advance_reservation'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    ratePlanDateUnique: unique('rateplan_restrictions_rate_plan_date_unique').on(t.ratePlanId, t.date),
  })
)

// Bookings are created in Phase 2 (reservation push). Table ships now so the
// schema migrates once.
export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  bookingId: text('booking_id').notNull().unique(), // NJS-{YYYYMMDD}-{6 alphanumeric}
  cmBookingId: text('cm_booking_id'),
  guestFirstName: text('guest_first_name').notNull(),
  guestLastName: text('guest_last_name').notNull(),
  guestEmail: text('guest_email').notNull(),
  guestPhone: text('guest_phone').notNull(),
  guestAddressLine1: text('guest_address_line1'),
  guestCity: text('guest_city'),
  guestState: text('guest_state'),
  guestCountry: text('guest_country').notNull().default('Nigeria'),
  guestZip: text('guest_zip'),
  checkin: date('checkin').notNull(),
  checkout: date('checkout').notNull(),
  roomId: integer('room_id')
    .notNull()
    .references(() => rooms.id),
  ratePlanId: integer('rate_plan_id')
    .notNull()
    .references(() => ratePlans.id),
  adults: integer('adults').notNull(),
  children: integer('children').notNull().default(0),
  amountBeforeTax: numeric('amount_before_tax', { precision: 12, scale: 2 }).notNull(),
  tax: numeric('tax', { precision: 12, scale: 2 }).notNull(),
  amountAfterTax: numeric('amount_after_tax', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('NGN'),
  specialRequests: text('special_requests'),
  status: text('status').notNull(), // confirmed | modified | cancelled
  pushStatus: text('push_status').notNull().default('pending'), // pending | pushed | failed
  pushAttempts: integer('push_attempts').notNull().default(0),
  lastPushError: text('last_push_error'),
  aiosellResponse: jsonb('aiosell_response'),
  nightlyPrices: jsonb('nightly_prices').notNull(), // [{ date, sellRate }]
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const webhookEvents = pgTable('webhook_events', {
  id: serial('id').primaryKey(),
  eventType: text('event_type').notNull(), // inventory | rates | inventory_restrictions | rate_restrictions | unknown
  rawPayload: jsonb('raw_payload').notNull(),
  headers: jsonb('headers').notNull(),
  processed: boolean('processed').notNull().default(false),
  processingError: text('processing_error'),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
})
