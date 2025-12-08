import apiClient from '../client'
import qs from 'qs'

export interface User {
  id: number
  documentId: string
  username: string
  email: string
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
}

export async function getUsers(filters?: UserFilters): Promise<UserWithOrderCount[]> {
  const queryParams: Record<string, unknown> = {}

  if (filters?.search) {
    queryParams.filters = {
      $or: [
        { username: { $containsi: filters.search } },
        { email: { $containsi: filters.search } },
      ],
    }
  }

  if (filters?.month && filters?.year) {
    queryParams.populate = {
      orders: {
        count: true,
        filters: {
          createdAt: {
            $gte: new Date(filters.year, filters.month - 1, 1).toISOString(),
            $lte: new Date(filters.year, filters.month, 0, 23, 59, 59, 999).toISOString(),
          },
        },
      },
    }
  }

  const query = qs.stringify(queryParams)
  const response = await apiClient.get<UserWithOrderCount[]>(`/api/users?${query}`)
  return response.data
}

export async function getUser(userId: number): Promise<User> {
  const response = await apiClient.get<User>(`/api/users/${userId}`)
  return response.data
}

export async function createUser(data: CreateUserRequest): Promise<User> {
  const response = await apiClient.post<User>('/api/users', {
    ...data,
    role: 1,
  })
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
