import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosError } from 'axios'
import { env } from '@/utils/env'
import { useAuthStore } from '@/stores/auth'

export interface ApiResponse<T> {
  data: T
  meta: {
    pagination: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

const apiClient: AxiosInstance = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore()

    // Ensure we have a valid token before making the request
    const validToken = await authStore.ensureValidToken()

    if (validToken && config.headers) {
      config.headers.Authorization = `Bearer ${validToken}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // If we get a 401 and haven't already retried, try to refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const authStore = useAuthStore()

      try {
        // Try to refresh the token
        const newToken = await authStore.refreshAccessToken()

        if (newToken && originalRequest.headers) {
          // Update the authorization header with the new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`

          // Retry the original request
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        // If refresh fails, logout and redirect to login
        console.error('Token refresh failed:', refreshError)
        await authStore.logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }

      // If we couldn't refresh, logout and redirect
      await authStore.logout()
      window.location.href = '/login'
    }

    return Promise.reject(error)
  },
)

export default apiClient
