export type WebhookEventType =
  | 'inventory'
  | 'rates'
  | 'inventory_restrictions'
  | 'rate_restrictions'
  | 'unknown'

export interface AiosellRestrictions {
  stopSell?: boolean | null
  minimumStay?: number | null
  maximumStay?: number | null
  closeOnArrival?: boolean | null
  closeOnDeparture?: boolean | null
  minimumStayArrival?: number | null
  maximumStayArrival?: number | null
  exactStayArrival?: number | null
  minimumAdvanceReservation?: number | null
  maximumAdvanceReservation?: number | null
}

export interface AiosellRoomUpdate {
  roomCode: string
  available?: number
  restrictions?: AiosellRestrictions
}

export interface AiosellRateUpdate {
  roomCode: string
  rateplanCode: string
  rate?: number
  restrictions?: AiosellRestrictions
}

export interface AiosellUpdateBlock {
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  rooms?: AiosellRoomUpdate[]
  rates?: AiosellRateUpdate[]
}

export interface AiosellWebhookPayload {
  hotelCode?: string
  updates?: AiosellUpdateBlock[]
}
