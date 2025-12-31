import apiClient, { type ApiResponse } from '../client'
import qs from 'qs'

export type Deadline = `${number}${number}:${number}${number}:${number}${number}`

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
}

export interface CreateMenuRequest {
  day: string
  items?: string[]
}

export interface UpdateMenuRequest {
  day?: string
  deadline?: Date
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

// Convert UTC time (HH:MM:SS) to local time (HH:MM) for display
const convertUtcToLocalTime = (utcTime: string, date: Date): Deadline => {
  const parts = utcTime.split(':').map(Number)
  const hours = parts[0] ?? 0
  const minutes = parts[1] ?? 0
  const utcDate = new Date(date)
  utcDate.setUTCHours(hours, minutes, 0, 0)

  const localHours = String(utcDate.getHours()).padStart(2, '0')
  const localMinutes = String(utcDate.getMinutes()).padStart(2, '0')
  return `${localHours}:${localMinutes}:00` as Deadline
}

const toUTCTime = (localTime: Date): Deadline => {
  const utcHours = String(localTime.getUTCHours()).padStart(2, '0')
  const utcMinutes = String(localTime.getUTCMinutes()).padStart(2, '0')
  return `${utcHours}:${utcMinutes}:00` as Deadline
}

const convertMenuDeadlineToLocalTime = (menu: Menu): Menu => {
  const deadline = convertUtcToLocalTime(menu.deadline, new Date(menu.day))
  return {
    ...menu,
    deadline: deadline,
  }
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
  return response.data.data.map(convertMenuDeadlineToLocalTime)
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
    ...populateCategories,
  })

  const response = await apiClient.get<ApiResponse<Menu[]>>(`/api/menus?${query}`)
  if (!response.data.data[0]) {
    return null
  }
  return convertMenuDeadlineToLocalTime(response.data.data[0])
}

export async function createMenu(data: CreateMenuRequest): Promise<Menu> {
  const query = qs.stringify({
    ...populateCategories,
  })
  const defaultDeadline = new Date()
  defaultDeadline.setHours(9, 30, 0, 0)

  const response = await apiClient.post<ApiResponse<Menu>>(`/api/menus?${query}`, {
    data: {
      day: data.day,
      items: data.items ? { set: data.items } : undefined,
      deadline: toUTCTime(defaultDeadline),
    },
  })
  return convertMenuDeadlineToLocalTime(response.data.data)
}

export async function updateMenu(menuId: string, data: UpdateMenuRequest): Promise<Menu> {
  const updateData: Record<string, unknown> = {}
  if (data.day !== undefined) updateData.day = data.day
  if (data.deadline !== undefined) {
    updateData.deadline = toUTCTime(data.deadline)
  }
  if (data.items !== undefined) {
    updateData.items = { set: data.items }
  }

  const query = qs.stringify({
    ...populateCategories,
  })
  const response = await apiClient.put<ApiResponse<Menu>>(`/api/menus/${menuId}?${query}`, {
    data: updateData,
  })
  return convertMenuDeadlineToLocalTime(response.data.data)
}

export async function deleteMenu(menuId: string): Promise<void> {
  await apiClient.delete(`/api/menus/${menuId}`)
}

export async function addMenuItemToMenu(menuId: string, itemId: string): Promise<Menu> {
  const query = qs.stringify({
    ...populateCategories,
  })
  const response = await apiClient.put<ApiResponse<Menu>>(`/api/menus/${menuId}?${query}`, {
    data: {
      items: {
        connect: [itemId],
      },
    },
  })
  return convertMenuDeadlineToLocalTime(response.data.data)
}

export async function removeMenuItemFromMenu(menuId: string, itemId: string): Promise<Menu> {
  const query = qs.stringify({
    ...populateCategories,
  })
  const response = await apiClient.put<ApiResponse<Menu>>(`/api/menus/${menuId}?${query}`, {
    data: {
      items: {
        disconnect: [itemId],
      },
    },
  })
  return convertMenuDeadlineToLocalTime(response.data.data)
}

export async function getMenuOfDay(): Promise<Menu> {
  const today = new Date()
  // Format date to YYYY-MM-DD for exact date match
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const dateString = `${year}-${month}-${day}`

  const query = qs.stringify({
    filters: { day: { $eq: dateString } },
    populate: {
      items: {
        populate: ['category'],
      },
    },
  })
  const response = await apiClient.get<ApiResponse<Menu[]>>(`/api/menus/?${query}`)
  if (!response.data.data[0]) {
    throw new Error('No menu found for today')
  }
  return convertMenuDeadlineToLocalTime(response.data.data[0])
}
