import apiClient from '../client'
import qs from 'qs'

export interface User {
  id: number
  documentId: string
  username: string
  email: string
  canInviteGuest?: boolean
  isGuest?: boolean
}

export interface UserWithOrderCount extends User {
  orders: {
    count: number
  }
}

export interface CreateUserRequest {
  username: string
  email: string
  password: string
  isGuest?: boolean
}

export interface UpdateUserRequest {
  username?: string
  email?: string
  password?: string
}

export interface UserFilters {
  search?: string
  month?: number
  year?: number
  isGuest?: boolean
}

export async function getUsers(filters?: UserFilters): Promise<UserWithOrderCount[]> {
  const queryParams: Record<string, unknown> = {}

  const filterParts: Record<string, unknown>[] = []
  if (filters?.search) {
    filterParts.push({
      $or: [
        { username: { $containsi: filters.search } },
        { email: { $containsi: filters.search } },
      ],
    })
  }
  if (filters?.isGuest === true) {
    filterParts.push({ isGuest: { $eq: true } })
  } else if (filters?.isGuest === false) {
    filterParts.push({ $or: [{ isGuest: { $eq: false } }, { isGuest: { $null: true } }] })
  }
  if (filterParts.length > 0) {
    queryParams.filters = filterParts.length === 1 ? filterParts[0] : { $and: filterParts }
  }

  if (filters?.month && filters?.year) {
    queryParams.populate = {
      orders: {
        count: true,
        filters: {
          createdAt: {
            $gte: new Date(filters.year, filters.month, 1).toISOString(),
            $lte: new Date(filters.year, filters.month + 1, 0, 23, 59, 59, 999).toISOString(),
          },
        },
      },
    }
  }
  const query = qs.stringify(queryParams, { encodeValuesOnly: true })
  const response = await apiClient.get<UserWithOrderCount[]>(`/api/users?${query}`)
  return response.data
}

export async function getUser(userId: number): Promise<User> {
  const response = await apiClient.get<User>(`/api/users/${userId}`)
  return response.data
}

export async function createUser(data: CreateUserRequest): Promise<User> {
  const payload: Record<string, unknown> = {
    ...data,
    role: 1,
    confirmed: true,
  }
  if (data.isGuest === true) {
    payload.isGuest = true
  }
  const response = await apiClient.post<User>('/api/users', payload)
  return response.data
}

export async function updateUser(userId: number, data: UpdateUserRequest): Promise<User> {
  const response = await apiClient.put<User>(`/api/users/${userId}`, {
    ...data,
  })
  return response.data
}

export async function deleteUser(userId: number): Promise<void> {
  await apiClient.delete(`/api/users/${userId}`)
}
