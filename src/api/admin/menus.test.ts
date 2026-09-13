import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ApiResponse } from '../client'

vi.mock('../client', () => {
  const mockGet = vi.fn()
  const mockPost = vi.fn()
  const mockPut = vi.fn()
  const mockDelete = vi.fn()
  return {
    default: {
      get: mockGet,
      post: mockPost,
      put: mockPut,
      delete: mockDelete,
    },
  }
})

import apiClient from '../client'
import { getMenus, createMenu, updateMenu, DEFAULT_DEADLINE, type Menu, type Deadline } from './menus'

describe('menus API — deadline verbatim round-trip', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns deadlines verbatim from getMenus (no UTC shift)', async () => {
    const mockResponse: { data: ApiResponse<Menu[]> } = {
      data: {
        data: [
          {
            documentId: 'abc123',
            day: '2026-01-15',
            deadline: '11:30:00',
            items: [],
          },
        ],
        meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: 1 } },
      },
    }
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

    const menus = await getMenus()

    expect(menus[0]?.deadline).toBe('11:30:00')
  })

  it('sends deadline as-is in createMenu (no Date-based default)', async () => {
    const mockResponse: { data: ApiResponse<Menu> } = {
      data: {
        data: {
          documentId: 'new123',
          day: '2026-06-15',
          deadline: '09:00:00',
          items: [],
        },
        meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: 1 } },
      },
    }
    vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

    const menu = await createMenu({ day: '2026-06-15' })

    expect(menu.deadline).toBe(DEFAULT_DEADLINE)
  })

  it('passes deadline string verbatim through updateMenu', async () => {
    const mockResponse: { data: ApiResponse<Menu> } = {
      data: {
        data: {
          documentId: 'xyz789',
          day: '2026-03-20',
          deadline: '14:00:00',
          items: [],
        },
        meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: 1 } },
      },
    }
    vi.mocked(apiClient.put).mockResolvedValue(mockResponse)

    const menu = await updateMenu('xyz789', { deadline: '14:00:00' as Deadline })

    expect(menu.deadline).toBe('14:00:00')
    expect(apiClient.put).toHaveBeenCalledWith(
      expect.stringContaining('/api/menus/xyz789'),
      expect.objectContaining({
        data: expect.objectContaining({ deadline: '14:00:00' }),
      }),
    )
  })
})
