import { AxiosError } from 'axios'
import apiClient, { type ApiResponse } from './client'
import qs from 'qs'

export interface OrderItem {
  documentId: string
}

export interface Order {
  documentId: string
  items: OrderItem[]
  note: string | null
  createdAt: string
}

export interface PlaceOrderRequest {
  items: string[]
  userId: string
  note?: string
}

export interface UpdateOrderRequest {
  items: string[]
  note?: string
}

export async function getCurrentOrder(userId: string): Promise<Order | null> {
  const today = new Date()
  const startOfDay = new Date(today.setHours(0, 0, 0, 0))
  const endOfDay = new Date(today.setHours(23, 59, 59, 999))
  const query = qs.stringify({
    filters: {
      createdAt: { $gte: startOfDay.toISOString(), $lte: endOfDay.toISOString() },
      user: { documentId: { $eq: userId } },
    },
    populate: {
      items: true,
    },
  })
  try {
    const response = await apiClient.get<ApiResponse<Order[]>>(`/api/orders/?${query}`)
    if (!response.data.data[0]) {
      return null
    }
    return response.data.data[0]
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      return null
    }
    throw error
  }
}

export async function placeOrder(request: PlaceOrderRequest): Promise<Order> {
  const response = await apiClient.post<Order>('/api/orders', {
    data: {
      items: {
        set: request.items,
      },
      note: request.note,
      user: request.userId,
    },
  })
  return response.data
}

export async function updateOrder(orderId: string, request: UpdateOrderRequest): Promise<Order> {
  const response = await apiClient.put<Order>(`/api/orders/${orderId}`, {
    data: {
      items: {
        set: request.items,
      },
      note: request.note,
    },
  })
  return response.data
}
