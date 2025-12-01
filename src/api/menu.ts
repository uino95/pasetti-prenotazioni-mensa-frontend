import apiClient, { type ApiResponse } from './client'
import qs from 'qs'

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

export interface MenuResponse {
  items: MenuItem[]
  deadline: string
}

export async function getMenuOfDay(): Promise<MenuResponse> {
  const today = new Date()
  const startOfDay = new Date(today.setHours(0, 0, 0, 0))
  const endOfDay = new Date(today.setHours(23, 59, 59, 999))
  const query = qs.stringify({
    filters: { day: { $gte: startOfDay.toISOString(), $lte: endOfDay.toISOString() } },
    populate: {
      items: {
        populate: ['category'],
      },
    },
  })
  const response = await apiClient.get<ApiResponse<MenuResponse[]>>(`/api/menus/?${query}`)
  if (!response.data.data[0]) {
    throw new Error('No menu found for today')
  }
  return response.data.data[0]
}
