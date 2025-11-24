import apiClient from './client'

export interface LoginCredentials {
  identifier: string
  password: string
}

export interface LoginResponse {
  jwt: string
  user: {
    documentId: string
    username: string
    email: string
  }
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/api/auth/local', credentials)
  return response.data
}

export async function logout(): Promise<void> {
  localStorage.removeItem('auth_token')
}
