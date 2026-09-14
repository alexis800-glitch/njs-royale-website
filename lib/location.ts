// NJS Royale Beach Resort — confirmed site location.
//
// The coordinates are the surveyed resort pin, not the centre of Mosere-Kogo Village.
// Every map, directions link and the Resort JSON-LD read from here so they cannot drift.

export const RESORT_NAME = 'NJS Royale Beach Resort'

export const RESORT_ADDRESS_LINES = [
  'Mosere-Kogo Village, via Eko Akete',
  'Ibeju-Lekki, Lagos State, Nigeria',
] as const

export const RESORT_COORDINATES = { latitude: 6.427361, longitude: 3.685278 } as const

const COORDS = '6.427361,3.685278'

/** Google Maps directions to the pin. No API key. */
export const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${COORDS}`

/** A plain Google Maps link to the pin, used for schema.org `hasMap`. */
export const MAP_LINK_URL = `https://www.google.com/maps/search/?api=1&query=${COORDS}`

/** Keyless Google Maps embed with a marker on the pin. Loaded only after the visitor asks. */
export const MAP_EMBED_URL = `https://www.google.com/maps?q=${COORDS}&z=15&output=embed`
