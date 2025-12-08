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
  const response = await apiClient.get<ApiResponse<MenuResponse[]>>(`/api/menus/?${query}`)
  if (!response.data.data[0]) {
    throw new Error('No menu found for today')
  }
  return response.data.data[0]
}
