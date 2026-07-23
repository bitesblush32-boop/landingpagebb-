// Shared boost utilities — week helpers + slot definitions

export const BOOST_TYPES = [
  'featured_1',
  'featured_2',
  'featured_3',
  'header_banner',
  'right_rail',
  'mid_grid',
] as const
export type BoostType = (typeof BOOST_TYPES)[number]

export const BOOST_LABELS: Record<BoostType, string> = {
  featured_1:    'Featured Slot 1',
  featured_2:    'Featured Slot 2',
  featured_3:    'Featured Slot 3',
  header_banner: 'Header Banner',
  right_rail:    'Right Rail',
  mid_grid:      'Mid-Grid Sponsored',
}

export const BOOST_DESCRIPTIONS: Record<BoostType, string> = {
  featured_1:    'Top card in the featured row on your community page. First position — highest visibility.',
  featured_2:    'Second card in the featured row. Strong visibility, lower competition.',
  featured_3:    'Third card in the featured row. Great for new companions building presence.',
  header_banner: 'Full-width banner above the browse grid. The first thing visitors see.',
  right_rail:    'Sticky sidebar card on desktop. Always visible as users scroll the page.',
  mid_grid:      'Native card inside the browse grid at position 7. Blends with organic results.',
}

export const DEFAULT_PRICES: Record<BoostType, number> = {
  featured_1:    15,
  featured_2:    15,
  featured_3:    15,
  header_banner: 25,
  right_rail:    15,
  mid_grid:      10,
}

export const VALID_COMMUNITIES = ['female', 'male', 'shemale'] as const
export type BoostCommunity = (typeof VALID_COMMUNITIES)[number]

// ── Week helpers ──────────────────────────────────────────────────────────────

/** Returns the Monday (00:00:00 UTC) of the ISO week containing `date` */
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day // Monday
  d.setUTCDate(d.getUTCDate() + diff)
  return d
}

/** Returns the Sunday of the same ISO week as `weekStart` */
export function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart)
  d.setUTCDate(d.getUTCDate() + 6)
  return d
}

/** Advance by N weeks */
export function addWeeks(date: Date, n: number): Date {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + n * 7)
  return d
}

/** Format as YYYY-MM-DD */
export function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Human-readable: "Jul 7 – Jul 13" */
export function formatWeekRange(weekStart: Date): string {
  const end = getWeekEnd(weekStart)
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  return `${fmt(weekStart)} – ${fmt(end)}`
}

export interface WeekSlot {
  weekStart: string       // YYYY-MM-DD
  weekEnd:   string       // YYYY-MM-DD
  label:     string       // "Jul 7 – Jul 13"
  isCurrent: boolean
  takenBy:   string | null  // companion name if taken, null if free
  isYours:   boolean      // true if current companion owns this slot
}
