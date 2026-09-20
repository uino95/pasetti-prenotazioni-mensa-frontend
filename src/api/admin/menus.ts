import apiClient, { type ApiResponse } from '../client'
import qs from 'qs'

export type Deadline = `${number}${number}:${number}${number}:${number}${number}.${number}${number}${number}`

export const DEFAULT_DEADLINE = '09:00:00.000' as Deadline

/** Strapi time fields require HH:mm:ss.SSS. `<input type="time">` yields HH:mm. */
export function toStrapiTime(value: string): Deadline {
  const [hours = '00', minutes = '00', rest = '00'] = value.split(':')
  const seconds = rest.split('.')[0] || '00'
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}.000` as Deadline
}

export interface Category {
  documentId: string
  name: string
  order: number
}
export interface MenuItem {
  documentId: string
  name: string
  category: Category
}
export interface Menu {
  documentId: string
  day: string
  deadline: Deadline
  items: MenuItem[]
  isCustom: boolean
}

export interface CreateMenuRequest {
  day: string
  items?: string[]
  deadline?: Deadline
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

const populateCategories = {
  populate: {
    items: {
      populate: ['category'],
    },
  },
}

export async function getMenus(filters?: MenuFilters): Promise<Menu[]> {
  const queryParams: Record<string, unknown> = {
    ...populateCategories,
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

export function toLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function getMenuByDate(date: Date): Promise<Menu | null> {
  const dateString = toLocalDateString(date)

  const query = qs.stringify({
    filters: { day: { $eq: dateString } },
    ...populateCategories,
  })

  const response = await apiClient.get<ApiResponse<Menu[]>>(`/api/menus?${query}`)
  if (!response.data.data[0]) {
    return null
  }
  return response.data.data[0]
}

export async function createMenu(data: CreateMenuRequest): Promise<Menu> {
  const query = qs.stringify({ ...populateCategories })

  const response = await apiClient.post<ApiResponse<Menu>>(`/api/menus?${query}`, {
    data: {
      day: data.day,
      items: data.items ? { set: data.items } : undefined,
      deadline: toStrapiTime(data.deadline ?? DEFAULT_DEADLINE),
      isCustom: true
    },
  })
  return response.data.data
}

export async function updateMenu(menuId: string, data: UpdateMenuRequest): Promise<Menu> {
  const updateData: Record<string, unknown> = {
    isCustom: true
  }
  if (data.day !== undefined) updateData.day = data.day
  if (data.deadline !== undefined) {
    updateData.deadline = toStrapiTime(data.deadline)
  }
  if (data.items !== undefined) {
    updateData.items = { set: data.items }
  }

  const query = qs.stringify({ ...populateCategories })
  const response = await apiClient.put<ApiResponse<Menu>>(`/api/menus/${menuId}?${query}`, {
    data: updateData,
  })
  return response.data.data
}

export async function deleteMenu(menuId: string): Promise<void> {
  await apiClient.delete(`/api/menus/${menuId}`)
}

export async function deleteMenus(menuIds: string[]): Promise<void> {
  await Promise.all(menuIds.map((id) => deleteMenu(id)))
}

export async function addMenuItemToMenu(menuId: string, itemId: string): Promise<Menu> {
  const query = qs.stringify({ ...populateCategories })
  const response = await apiClient.put<ApiResponse<Menu>>(`/api/menus/${menuId}?${query}`, {
    data: { items: { connect: [itemId] } },
  })
  return response.data.data
}

export async function removeMenuItemFromMenu(menuId: string, itemId: string): Promise<Menu> {
  const query = qs.stringify({ ...populateCategories })
  const response = await apiClient.put<ApiResponse<Menu>>(`/api/menus/${menuId}?${query}`, {
    data: { items: { disconnect: [itemId] } },
  })
  return response.data.data
}

export async function getMenuOfDay(): Promise<Menu> {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const dateString = `${year}-${month}-${day}`

  const query = qs.stringify({
    filters: { day: { $eq: dateString } },
    populate: { items: { populate: ['category'] } },
  })
  const response = await apiClient.get<ApiResponse<Menu[]>>(`/api/menus/?${query}`)
  if (!response.data.data[0]) {
    throw new Error('No menu found for today')
  }
  return response.data.data[0]
}
