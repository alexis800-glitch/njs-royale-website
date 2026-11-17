import { test, expect, type Page } from '@playwright/test'

// The booking journey, in a real browser, on desktop and on a phone viewport.
//
// Every guest here is fictional and every room is synthetic. No payment
// processor and no Aiosell endpoint is contacted: the simulated outcomes are
// decided by the server's mock, which is why a declined card can be tested at
// all without one.

const SHOTS = 'e2e/screenshots'

/** A fictional guest. Never a real person, never a real number. */
const GUEST = {
  first: 'Amara',
  last: 'Test-Guest',
  email: 'amara.test-guest@example.test',
  phone: '0803 000 0000',
}

/**
 * The journey's own error notice.
 *
 * Next.js renders an empty <div role="alert" id="__next-route-announcer__"> on
 * every page, so a bare getByRole('alert') matches two elements and fails
 * strict mode. This excludes it rather than loosening the query.
 */
function errorAlert(page: Page) {
  return page.locator('[role=alert]:not(#__next-route-announcer__)')
}

async function shot(page: Page, name: string) {
  const project = test.info().project.name
  await page.screenshot({ path: `${SHOTS}/${project}-${name}.png`, fullPage: true })
}

/** A viewport-sized shot, which shows fixed elements where a guest sees them. */
async function viewportShot(page: Page, name: string) {
  const project = test.info().project.name
  await page.screenshot({ path: `${SHOTS}/${project}-${name}.png` })
}

/** Step 1: fill the stay and search. */
async function fillStay(
  page: Page,
  { arrival = '2027-07-24', departure = '2027-07-27', adults = '2', rooms = '1' } = {},
) {
  await page.getByLabel('Arrival').fill(arrival)
  await page.getByLabel('Departure').fill(departure)
  await page.getByLabel('Adults').selectOption(adults)
  await page.getByLabel('Rooms').selectOption(rooms)
  await page.getByRole('button', { name: 'Search rooms' }).click()
}

/** Step 3: fill the guest form. */
async function fillGuest(page: Page) {
  await page.getByLabel('First name').fill(GUEST.first)
  await page.getByLabel('Last name').fill(GUEST.last)
  await page.getByLabel('Email').fill(GUEST.email)
  await page.getByLabel('Mobile or WhatsApp').fill(GUEST.phone)
  await page.getByRole('button', { name: 'Review booking' }).click()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/booking')
})

// ---------------------------------------------------------------------------
// The page itself
// ---------------------------------------------------------------------------

test('the prototype announces itself before it shows a room', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Reserve your stay' })).toBeVisible()
  await expect(page.getByRole('heading', { name: /not a live booking system/i })).toBeVisible()
  await expect(page.getByText(/No reservation is created/i)).toBeVisible()
  await expect(page.getByText(/No payment is taken/i)).toBeVisible()
  // The sentence appears in the page header and again in step one.
  await expect(
    page.getByText(/Guest rooms and accommodation open on 23 July 2027/i).first(),
  ).toBeVisible()
  await shot(page, '01-landing')
})

test('the fixed navigation does not cover the page heading', async ({ page }) => {
  // A full-page screenshot renders a fixed navbar wherever the viewport was,
  // which looks like an overlap but is not one. This measures the real thing
  // at the top of the page.
  await viewportShot(page, '00-viewport-top')
  const covering = await page.evaluate(() => {
    const h1 = document.querySelector('h1')
    if (!h1) return ['no h1']
    const heading = h1.getBoundingClientRect()
    return Array.from(document.querySelectorAll('body *'))
      .filter((el) => {
        const style = getComputedStyle(el)
        if (style.position !== 'fixed' && style.position !== 'sticky') return false
        if (style.visibility === 'hidden' || style.opacity === '0') return false
        const box = el.getBoundingClientRect()
        if (box.height === 0 || box.width === 0) return false
        return box.bottom > heading.top && box.top < heading.bottom
      })
      .map((el) => `${el.tagName}.${String(el.className).slice(0, 50)}`)
  })
  expect(covering, 'something fixed is sitting over the page heading').toEqual([])
})

test('the integration status names what is blocked', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /waiting on Aiosell/i })).toBeVisible()
  await expect(page.getByText('Blocked, pending written confirmation')).toBeVisible()
  await expect(page.getByText(/Live availability and inventory counts/i)).toBeVisible()
  await shot(page, '09-integration-status')
})

// ---------------------------------------------------------------------------
// Date restrictions
// ---------------------------------------------------------------------------

test('the arrival field will not offer a date before guest rooms open', async ({ page }) => {
  await expect(page.getByLabel('Arrival')).toHaveAttribute('min', '2027-07-23')
})

test('an arrival before 23 July 2027 is refused and the journey does not advance', async ({
  page,
}) => {
  await fillStay(page, { arrival: '2027-07-22', departure: '2027-07-26' })
  await expect(page.getByText(/Guest rooms open on 23 July 2027/i)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Choose your room' })).toBeHidden()
  await shot(page, '02-arrival-too-early')
})

test('a same-day departure is refused', async ({ page }) => {
  await fillStay(page, { arrival: '2027-07-24', departure: '2027-07-24' })
  // By id: the field's hint uses the same words as the error.
  await expect(page.locator('#bk-departure-error')).toContainText(
    /at least one night after your arrival/i,
  )
  await expect(page.getByRole('heading', { name: 'Choose your room' })).toBeHidden()
})

// ---------------------------------------------------------------------------
// The whole journey
// ---------------------------------------------------------------------------

test('a guest can go from dates to a simulated confirmation', async ({ page }) => {
  await fillStay(page)

  // Step 2 — rooms.
  await expect(page.getByRole('heading', { name: 'Choose your room' })).toBeVisible()
  const radios = page.getByRole('radio')
  expect(await radios.count()).toBeGreaterThan(1)
  await expect(page.getByText(/room subtotal/i).first()).toBeVisible()
  await expect(page.getByText(/to be confirmed/i).first()).toBeVisible()
  await shot(page, '03-rooms')

  await radios.first().check()
  await page.getByRole('button', { name: 'Continue' }).click()

  // Step 3 — details.
  await expect(page.getByRole('heading', { name: 'Guest details' })).toBeVisible()
  await shot(page, '04-guest-details')
  await fillGuest(page)

  // Step 4 — review.
  await expect(page.getByRole('heading', { name: 'Review your booking' })).toBeVisible()
  await expect(page.getByText('Room subtotal', { exact: true })).toBeVisible()
  await expect(page.getByText(/not the final amount payable/i)).toBeVisible()
  await expect(page.getByText(/Total payable/)).toBeHidden()
  await expect(page.getByText(/Nothing is reserved and no payment is taken/i)).toBeVisible()
  await shot(page, '05-review')

  // Confirm.
  await page.getByRole('button', { name: 'Confirm booking' }).click()
  await expect(page.getByRole('heading', { name: /how a confirmation would read/i })).toBeVisible()
  await expect(page.getByText(/No reservation has been created/i)).toBeVisible()
  await expect(page.getByText(/^NJS-\d{8}-[A-Z2-9]{6}$/)).toBeVisible()
  await expect(page.getByText(/none returned/i)).toBeVisible()
  await shot(page, '06-confirmed')
})

// ---------------------------------------------------------------------------
// Payment outcomes
// ---------------------------------------------------------------------------

async function toReview(page: Page) {
  await fillStay(page)
  await page.getByRole('radio').first().check()
  await page.getByRole('button', { name: 'Continue' }).click()
  await fillGuest(page)
  await expect(page.getByRole('heading', { name: 'Review your booking' })).toBeVisible()
}

test('a declined payment makes no reservation and says the guest was not charged', async ({
  page,
}) => {
  await toReview(page)
  await page.getByRole('radio', { name: 'Declined' }).check()
  await page.getByRole('button', { name: 'Confirm booking' }).click()

  const alert = errorAlert(page)
  await expect(alert).toBeVisible()
  await expect(alert).toContainText(/not been charged/i)
  await expect(page.getByRole('heading', { name: /how a confirmation would read/i })).toBeHidden()
  await shot(page, '07-payment-declined')
})

test('an abandoned payment leaves the booking unconfirmed', async ({ page }) => {
  await toReview(page)
  await page.getByRole('radio', { name: 'Abandoned' }).check()
  await page.getByRole('button', { name: 'Confirm booking' }).click()
  await expect(errorAlert(page)).toContainText(/has not been confirmed/i)
})

test('an unreachable processor offers a retry', async ({ page }) => {
  await toReview(page)
  await page.getByRole('radio', { name: 'Processor unreachable' }).check()
  await page.getByRole('button', { name: 'Confirm booking' }).click()
  const alert = errorAlert(page)
  await expect(alert).toContainText(/not been charged/i)
  await expect(alert.getByRole('button', { name: 'Try again' })).toBeVisible()
})

test('a successful payment after a declined one still confirms once', async ({ page }) => {
  await toReview(page)
  await page.getByRole('radio', { name: 'Declined' }).check()
  await page.getByRole('button', { name: 'Confirm booking' }).click()
  await expect(errorAlert(page)).toBeVisible()

  await page.getByRole('radio', { name: 'Authorised' }).check()
  await page.getByRole('button', { name: 'Confirm booking' }).click()
  await expect(page.getByText(/^NJS-\d{8}-[A-Z2-9]{6}$/)).toBeVisible()
})

// ---------------------------------------------------------------------------
// The Aiosell stub
// ---------------------------------------------------------------------------

test('the unconfigured Aiosell adapter refuses, and the journey says so properly', async ({
  page,
}) => {
  await page.goto('/booking?provider=aiosell')
  await expect(page.getByText(/Running against the/i)).toBeVisible()
  await expect(page.getByText(/which is a stub/i)).toBeVisible()
  await shot(page, '08-aiosell-notice')

  await fillStay(page)
  const alert = errorAlert(page)
  await expect(alert).toBeVisible()
  await expect(alert).toContainText(/not yet available/i)
  await expect(alert).toContainText(/contact the resort/i)
  // Not retryable: an unconfigured provider will not configure itself.
  await expect(alert.getByRole('button', { name: 'Try again' })).toBeHidden()
  await expect(page.getByRole('heading', { name: 'Choose your room' })).toBeHidden()
  await shot(page, '08b-aiosell-refused')
})

// ---------------------------------------------------------------------------
// Keyboard and accessibility
// ---------------------------------------------------------------------------

test('every stay control is reachable by keyboard, in reading order', async ({ page }) => {
  // Not an exact tab-by-tab assertion: Chromium's date input has internal
  // day/month/year segments, so Tab steps through those before leaving the
  // field. What matters is that each control is reachable and that they come
  // in reading order.
  await page.getByLabel('Arrival').focus()
  const seen: string[] = []
  for (let i = 0; i < 30; i++) {
    const id = await page.evaluate(() => document.activeElement?.id ?? '')
    if (id && !seen.includes(id)) seen.push(id)
    await page.keyboard.press('Tab')
  }

  const wanted = ['bk-arrival', 'bk-departure', 'bk-adults', 'bk-children', 'bk-rooms']
  const positions = wanted.map((id) => seen.indexOf(id))
  expect(positions.every((p) => p >= 0), `tab-reachable ids were: ${seen.join(', ')}`).toBe(true)
  expect(positions, 'controls should be tabbed in reading order').toEqual(
    [...positions].sort((a, b) => a - b),
  )
})

test('the stay form can be submitted from the keyboard', async ({ page }) => {
  await page.getByLabel('Arrival').fill('2027-07-24')
  await page.getByLabel('Departure').fill('2027-07-27')
  await page.getByRole('button', { name: 'Search rooms' }).focus()
  await expect(page.getByRole('button', { name: 'Search rooms' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Choose your room' })).toBeVisible()
})

test('focus moves to the new step rather than being left behind', async ({ page }) => {
  await fillStay(page)
  await expect(page.getByRole('heading', { name: 'Choose your room' })).toBeVisible()
  // The step container takes focus, so the next Tab lands inside the new step.
  const focusedIsInStep = await page.evaluate(() => {
    const active = document.activeElement
    if (!active) return false
    return active.tagName === 'DIV' || !!active.closest('fieldset')
  })
  expect(focusedIsInStep).toBe(true)
})

test('every form control has an accessible name and errors are announced', async ({ page }) => {
  const unnamed = await page.evaluate(() => {
    const controls = Array.from(
      document.querySelectorAll('input:not([type=hidden]), select, textarea'),
    )
    return controls
      .filter((el) => {
        const node = el as HTMLElement
        // Skip the honeypot, which is hidden from assistive technology on purpose.
        if (node.closest('[aria-hidden="true"]')) return false
        const id = node.getAttribute('id')
        const labelled =
          (id && document.querySelector(`label[for="${id}"]`)) ||
          node.closest('label') ||
          node.getAttribute('aria-label') ||
          node.getAttribute('aria-labelledby')
        return !labelled
      })
      .map((el) => (el as HTMLElement).outerHTML.slice(0, 80))
  })
  expect(unnamed).toEqual([])

  // An invalid submit marks the field and links the message to it.
  await fillStay(page, { arrival: '2027-07-22', departure: '2027-07-26' })
  const arrival = page.getByLabel('Arrival')
  await expect(arrival).toHaveAttribute('aria-invalid', 'true')
  const describedBy = await arrival.getAttribute('aria-describedby')
  expect(describedBy).toContain('bk-arrival-error')
})

test('the stepper marks the current step for assistive technology', async ({ page }) => {
  await expect(page.locator('[aria-current="step"]')).toHaveText(/Stay/)
  await fillStay(page)
  await expect(page.locator('[aria-current="step"]')).toHaveText(/Rooms/)
})

// ---------------------------------------------------------------------------
// Responsiveness
// ---------------------------------------------------------------------------

test('the page never scrolls sideways at any step', async ({ page }) => {
  const noOverflow = async (where: string) => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow, `horizontal overflow at ${where}`).toBeLessThanOrEqual(1)
  }

  await noOverflow('step 1')
  await fillStay(page)
  await noOverflow('step 2')
  await page.getByRole('radio').first().check()
  await page.getByRole('button', { name: 'Continue' }).click()
  await noOverflow('step 3')
  await fillGuest(page)
  await noOverflow('step 4')
  await page.getByRole('button', { name: 'Confirm booking' }).click()
  await expect(page.getByText(/^NJS-\d{8}-[A-Z2-9]{6}$/)).toBeVisible()
  await noOverflow('confirmation')
})

test('tap targets on the primary controls are at least 44px tall', async ({ page }) => {
  for (const name of ['Search rooms']) {
    const box = await page.getByRole('button', { name }).boundingBox()
    expect(box, `${name} should be visible`).not.toBeNull()
    expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(44)
  }
  await fillStay(page)
  for (const name of ['Continue', 'Change dates']) {
    const box = await page.getByRole('button', { name }).boundingBox()
    expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(44)
  }
})
