import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { dayRange, isSameLocalDay, parseLocalDate, toLocalDateString } from './date'

const originalTz = process.env.TZ

// `new Date("YYYY-MM-DD")` parses as UTC midnight, so in UTC-negative offsets the
// same Date's local components fall on the previous day. The helpers must build the
// selected day from local components so the calendar date the user picked is preserved.
describe('date helpers — timezone-independent date handling', () => {
  beforeEach(() => {
    process.env.TZ = 'America/New_York'
  })

  afterEach(() => {
    process.env.TZ = originalTz
  })

  describe('parseLocalDate', () => {
    it('builds a local-midnight Date for the picked calendar day (UTC-5)', () => {
      const picked = parseLocalDate('2024-07-15')
      expect(picked.getFullYear()).toBe(2024)
      expect(picked.getMonth()).toBe(6)
      expect(picked.getDate()).toBe(15)
      // Unlike `new Date("2024-07-15")`, the local components are not the previous day.
      expect(picked.toISOString()).not.toBe('2024-07-15T00:00:00.000Z')
    })

    it('round-trips with toLocalDateString in any offset (UTC-4 vs UTC+2)', () => {
      expect(toLocalDateString(parseLocalDate('2024-07-15'))).toBe('2024-07-15')

      process.env.TZ = 'Europe/Rome'
      expect(toLocalDateString(parseLocalDate('2024-07-15'))).toBe('2024-07-15')
    })

    it('rejects malformed input', () => {
      expect(() => parseLocalDate('')).toThrow()
      expect(() => parseLocalDate('2024-7-5')).toThrow()
      expect(() => parseLocalDate('not-a-date')).toThrow()
    })
  })

  describe('toLocalDateString', () => {
    it('formats from local components, not UTC (UTC-4 and UTC+2)', () => {
      // Same local midnight built under two offsets must format identically.
      process.env.TZ = 'America/New_York'
      const newYorkMidnight = new Date(2024, 6, 15)
      process.env.TZ = 'Europe/Rome'
      const romeMidnight = new Date(2024, 6, 15)

      // The two instants differ, but both describe the picked day in their own timezone.
      expect(newYorkMidnight.getTime()).not.toBe(romeMidnight.getTime())
      expect(toLocalDateString(newYorkMidnight)).toBe('2024-07-15')
      expect(toLocalDateString(romeMidnight)).toBe('2024-07-15')
      // `toISOString()` on the Rome instant would report 2024-07-14 (the previous day).
      expect(romeMidnight.toISOString().split('T')[0]).toBe('2024-07-14')
    })

    it('pads month and day to two digits', () => {
      expect(toLocalDateString(parseLocalDate('2024-01-05'))).toBe('2024-01-05')
    })
  })

  describe('isSameLocalDay', () => {
    it('is true when the picked day is today for a UTC-5 user', () => {
      const now = new Date(2024, 6, 15, 14, 30) // local afternoon
      const pickedToday = parseLocalDate(toLocalDateString(now))
      expect(isSameLocalDay(pickedToday, now)).toBe(true)
    })

    it('is false when the picked day is not today for a UTC-5 user', () => {
      const now = new Date(2024, 6, 15, 14, 30)
      const pickedOtherDay = parseLocalDate('2024-07-14')
      expect(isSameLocalDay(pickedOtherDay, now)).toBe(false)
    })

    it('does not confuse the UTC-midnight parse with a local day (regression)', () => {
      // This is the reported bug: `new Date("2024-07-15")` is UTC midnight, which in
      // UTC-5 lands on the 14th local. If a caller passed it through, "today" is
      // misdetected even though the picker said 2024-07-15.
      const now = new Date(2024, 6, 15, 14, 30)
      const utcMidnightParse = new Date('2024-07-15')
      expect(isSameLocalDay(utcMidnightParse, now)).toBe(false)
      expect(isSameLocalDay(parseLocalDate('2024-07-15'), now)).toBe(true)
    })
  })

  describe('dayRange', () => {
    it('spans the local calendar day as UTC instants (summer, UTC-4)', () => {
      process.env.TZ = 'America/New_York'
      const { start, end } = dayRange(parseLocalDate('2024-07-15'))
      expect(start.toISOString()).toBe('2024-07-15T04:00:00.000Z')
      expect(end.toISOString()).toBe('2024-07-16T03:59:59.999Z')
      expect(start.getHours()).toBe(0)
      expect(end.getHours()).toBe(23)
    })

    it('spans the local calendar day as UTC instants (winter, UTC-5)', () => {
      process.env.TZ = 'America/New_York'
      const { start, end } = dayRange(parseLocalDate('2024-01-15'))
      expect(start.toISOString()).toBe('2024-01-15T05:00:00.000Z')
      expect(end.toISOString()).toBe('2024-01-16T04:59:59.999Z')
    })

    it('spans the local calendar day as UTC instants (UTC+2)', () => {
      process.env.TZ = 'Europe/Rome'
      const { start, end } = dayRange(parseLocalDate('2024-07-15'))
      expect(start.toISOString()).toBe('2024-07-14T22:00:00.000Z')
      expect(end.toISOString()).toBe('2024-07-15T21:59:59.999Z')
    })
  })
})
