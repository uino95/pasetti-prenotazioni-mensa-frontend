import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiResponse } from './client'

vi.mock('./client', () => {
  const mockGet = vi.fn()
  return {
    default: {
      get: mockGet,
    },
  }
})

import apiClient from './client'
import { getAllOrdersByDate } from './orders'
import { parseLocalDate } from '../utils/date'

const originalTz = process.env.TZ

afterEach(() => {
  process.env.TZ = originalTz
})

describe('getAllOrdersByDate — day boundary filter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const emptyPage: { data: ApiResponse<never[]> } = {
    data: {
      data: [],
      meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: 0 } },
    },
  }

  it('filters the selected calendar day as UTC instants (summer, UTC-4)', async () => {
    process.env.TZ = 'America/New_York'
    vi.mocked(apiClient.get).mockResolvedValueOnce(emptyPage as never)

    await getAllOrdersByDate(parseLocalDate('2024-07-15'))

    const url = decodeURIComponent(String(vi.mocked(apiClient.get).mock.calls[0]?.[0]))
    // Local Jul 15 (EDT, UTC-4) runs from 04:00:00.000Z to Jul 16 03:59:59.999Z.
    expect(url).toContain('[$gte]=2024-07-15T04:00:00.000Z')
    expect(url).toContain('[$lte]=2024-07-16T03:59:59.999Z')
  })

  it('filters the selected calendar day as UTC instants (winter, UTC-5)', async () => {
    process.env.TZ = 'America/New_York'
    vi.mocked(apiClient.get).mockResolvedValueOnce(emptyPage as never)

    await getAllOrdersByDate(parseLocalDate('2024-01-15'))

    const url = decodeURIComponent(String(vi.mocked(apiClient.get).mock.calls[0]?.[0]))
    // Local Jan 15 (EST, UTC-5) runs from 05:00:00.000Z to Jan 16 04:59:59.999Z.
    expect(url).toContain('[$gte]=2024-01-15T05:00:00.000Z')
    expect(url).toContain('[$lte]=2024-01-16T04:59:59.999Z')
  })

  it('never requests the previous calendar day for the picked day', async () => {
    process.env.TZ = 'America/New_York'
    vi.mocked(apiClient.get).mockResolvedValueOnce(emptyPage as never)

    await getAllOrdersByDate(parseLocalDate('2024-07-15'))

    const url = decodeURIComponent(String(vi.mocked(apiClient.get).mock.calls[0]?.[0]))
    expect(url).not.toContain('[$gte]=2024-07-14T')
  })
})
