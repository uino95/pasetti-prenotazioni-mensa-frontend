import apiClient, { type ApiResponse } from '../client'
import qs from 'qs'
import type { MenuItem } from '../menu'

export type Deadline = `${number}${number}:${number}${number}:${number}${number}`

export interface Menu {
  documentId: string
  day: string
  deadline: Deadline
  items: MenuItem[]
}

export interface CreateMenuRequest {
  day: string
  items?: string[]
}

export interface UpdateMenuRequest {
  day?: string
  deadline?: Deadline
  items?: string[]
}

export interface MenuFilters {
  day?: {
    from?: string
    to?: string
  }
}

export async function getMenus(filters?: MenuFilters): Promise<Menu[]> {
  const queryParams: Record<string, unknown> = {
    populate: {
      items: {
        populate: ['category'],
      },
    },
  }

  if (filters?.day) {
    const dayFilters: Record<string, unknown> = {}
    if (filters.day.from) {
      dayFilters.$gte = filters.day.from
    }
    if (filters.day.to) {
      dayFilters.$lte = filters.day.to
    }
    if (Object.keys(dayFilters).length > 0) {
      queryParams.filters = {
        day: dayFilters,
      }
    }
  }

  const query = qs.stringify(queryParams)
  const response = await apiClient.get<ApiResponse<Menu[]>>(`/api/menus?${query}`)
  return response.data.data
}

export async function getMenuByDate(date: Date): Promise<Menu | null> {
  // Format date to YYYY-MM-DD for exact date match
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dateString = `${year}-${month}-${day}`

  const query = qs.stringify({
    filters: {
      day: {
        $eq: dateString,
      },
    },
    populate: {
      items: {
        populate: ['category'],
      },
    },
  })

  const response = await apiClient.get<ApiResponse<Menu[]>>(`/api/menus?${query}`)
  if (!response.data.data[0]) {
    return null
  }
  return response.data.data[0]
}

export async function createMenu(data: CreateMenuRequest): Promise<Menu> {
  const response = await apiClient.post<ApiResponse<Menu>>('/api/menus', {
    data: {
      day: data.day,
      items: data.items ? { set: data.items } : undefined,
    },
  })
  return response.data.data
}

export async function updateMenu(menuId: string, data: UpdateMenuRequest): Promise<Menu> {
  const updateData: Record<string, unknown> = {}
  if (data.day !== undefined) updateData.day = data.day
  if (data.deadline !== undefined) updateData.deadline = data.deadline
  if (data.items !== undefined) {
    updateData.items = { set: data.items }
  }

  const response = await apiClient.put<ApiResponse<Menu>>(`/api/menus/${menuId}`, {
    data: updateData,
  })
  return response.data.data
}

export async function deleteMenu(menuId: string): Promise<void> {
  await apiClient.delete(`/api/menus/${menuId}`)
}

export async function addMenuItemToMenu(menuId: string, itemId: string): Promise<Menu> {
  const query = qs.stringify({
    populate: {
      items: {
        populate: ['category'],
      },
    },
  })
  const response = await apiClient.put<ApiResponse<Menu>>(`/api/menus/${menuId}?${query}`, {
    data: {
      items: {
        connect: [itemId],
      },
    },
  })
  return response.data.data
}

export async function removeMenuItemFromMenu(menuId: string, itemId: string): Promise<Menu> {
  const query = qs.stringify({
    populate: {
      items: {
        populate: ['category'],
      },
    },
  })
  const response = await apiClient.put<ApiResponse<Menu>>(`/api/menus/${menuId}?${query}`, {
    data: {
      items: {
        disconnect: [itemId],
      },
    },
  })
  return response.data.data
}
