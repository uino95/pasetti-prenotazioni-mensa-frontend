const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Parses "YYYY-MM-DD" as a local-midnight Date. Date-only strings passed to
 * `new Date()` are parsed as UTC midnight, which lands on the previous local day
 * in negative UTC offsets.
 */
export function parseLocalDate(dateString: string): Date {
  const match = DAY_PATTERN.exec(dateString)
  if (!match) {
    throw new RangeError(`Invalid date string: ${dateString}`)
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

/** Formats a Date as "YYYY-MM-DD" using its local calendar components. */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Compares only the local calendar day, ignoring time-of-day. */
export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/**
 * Returns the inclusive start (local 00:00:00.000) and end (local 23:59:59.999)
 * instants of the given date's calendar day. Built from local components so the
 * UTC-encoded boundaries match the day the caller selected regardless of offset.
 */
export function dayRange(date: Date): { start: Date; end: Date } {
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()
  return {
    start: new Date(year, month, day),
    end: new Date(year, month, day, 23, 59, 59, 999),
  }
}

export function isDeadlinePassed(deadline: string, now?: Date): boolean {
  const currentTime = now ?? new Date()
  const [hours, minutes] = deadline.split(':').map(Number)
  const deadlineTime = new Date()
  if (hours === undefined || minutes === undefined) {
    return true
  }
  deadlineTime.setHours(hours, minutes, 0, 0)

  return currentTime >= deadlineTime
}

export function toRelativeDate(date: Date): string {
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor(
    (startOfDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
  )

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'tomorrow'
  if (diffDays === -1) return 'yesterday'

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}/${date.getFullYear()}`
}

export function timeUntilDeadline(deadline: string, now?: Date): string {
  const currentTime = now ?? new Date()
  const [hours, minutes] = deadline.split(':').map(Number)
  const deadlineTime = new Date()
  if (hours === undefined || minutes === undefined) {
    return '0m'
  }
  deadlineTime.setHours(hours, minutes, 0, 0)

  const diff = deadlineTime.getTime() - currentTime.getTime()

  if (diff <= 0) {
    return '0m'
  }

  const hoursRemaining = Math.floor(diff / (1000 * 60 * 60))
  const minutesRemaining = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hoursRemaining > 0) {
    return `${hoursRemaining}h ${minutesRemaining}m`
  }
  return `${minutesRemaining}m`
}
