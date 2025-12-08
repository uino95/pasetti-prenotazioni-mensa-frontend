import { ref, computed, toRefs } from 'vue'
import { defineStore } from 'pinia'
import {
  login as apiLogin,
  refreshToken as apiRefreshToken,
  getUser,
  type UserMeResponse,
} from '@/api/auth'
import { AxiosError } from 'axios'
import { isTokenExpired } from '@/utils/jwt'

export const useAuthStore = defineStore(
  'auth',
  () => {
    const token = ref<string | null>(null)
    const refreshTokenValue = ref<string | null>(null)
    const user = ref<UserMeResponse | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const isRefreshing = ref(false)
    let refreshPromise: Promise<string | null> | null = null

    const isAuthenticated = computed(() => {
      return !!token.value
    })

    async function login(identifier: string, password: string): Promise<void> {
      loading.value = true
      error.value = null
      try {
        const response = await apiLogin({ identifier, password })
        token.value = response.jwt
        refreshTokenValue.value = response.refreshToken || null
        user.value = await getUser()
      } catch (err: unknown) {
        if (err instanceof AxiosError && err.response?.status === 400) {
          error.value = err.response?.data?.error?.message || 'Login failed'
        } else {
          error.value = err instanceof Error ? err.message : 'Login failed'
        }
        throw err
      } finally {
        loading.value = false
      }
    }

    async function refreshAccessToken(): Promise<string | null> {
      // If already refreshing, return the existing promise
      if (refreshPromise) {
        return refreshPromise
      }

      if (!refreshTokenValue.value) {
        return null
      }

      isRefreshing.value = true
      refreshPromise = (async () => {
        try {
          const response = await apiRefreshToken(refreshTokenValue.value!)
          token.value = response.jwt
          if (response.refreshToken) {
            refreshTokenValue.value = response.refreshToken
          }
          return response.jwt
        } catch (err: unknown) {
          // If refresh fails, clear tokens and logout
          token.value = null
          refreshTokenValue.value = null
          user.value = null
          throw err
        } finally {
          isRefreshing.value = false
          refreshPromise = null
        }
      })()

      return refreshPromise
    }

    async function ensureValidToken(): Promise<string | null> {
      if (!token.value) {
        return null
      }

      // Check if token is expired or about to expire
      if (isTokenExpired(token.value)) {
        // Try to refresh the token
        try {
          return await refreshAccessToken()
        } catch (err) {
          console.error('Failed to refresh token:', err)
          return null
        }
      }

      return token.value
    }

    async function logout(): Promise<void> {
      token.value = null
      refreshTokenValue.value = null
      user.value = null
    }

    return {
      ...toRefs({
        token,
        refreshToken: refreshTokenValue,
        user,
        loading,
        error,
        isRefreshing,
      }),
      isAuthenticated,
      login,
      refreshAccessToken,
      ensureValidToken,
      logout,
    }
  },
  {
    persist: true,
  },
)
