import axios from 'axios'
import apiClient from './client'
import { env } from '@/utils/env'
import type { User } from './admin/users'
import qs from 'qs'

export interface LoginCredentials {
  identifier: string
  password: string
}

interface Role {
  documentId: string
  description: string
  name: string
  type: string
  createdAt: string
  publishedAt: string
  updatedAt: string
}

export interface UserMeResponse extends User {
  role: Role
}

export interface LoginResponse {
  jwt: string
  refreshToken?: string
  user: {
    documentId: string
    username: string
    email: string
  }
}

export interface RefreshTokenResponse {
  jwt: string
  refreshToken?: string
}

// Separate axios instance for refresh token calls to avoid interceptor loops
const refreshClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/api/auth/local', {
    ...credentials,
    requestRefresh: true,
  })
  return response.data
}

export async function refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
  // Use refreshClient to avoid triggering the auth interceptor
  const response = await refreshClient.post<RefreshTokenResponse>('/api/auth/local/refresh', {
    refreshToken,
  })
  return response.data
}

export async function getUser(): Promise<UserMeResponse> {
  const query = qs.stringify({
    populate: {
      role: true,
    },
  })
  const response = await apiClient.get<UserMeResponse>(`/api/users/me?${query}`)
  return response.data
}
