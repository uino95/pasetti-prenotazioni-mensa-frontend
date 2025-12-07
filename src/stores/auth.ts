import { ref, computed, toRefs } from 'vue'
import { defineStore } from 'pinia'
import { login as apiLogin, type LoginResponse } from '@/api/auth'
import { AxiosError } from 'axios'

export const useAuthStore = defineStore(
  'auth',
  () => {
    const token = ref<string | null>(null)
    const user = ref<LoginResponse['user'] | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    const isAuthenticated = computed(() => {
      return !!token.value
    })

    async function login(identifier: string, password: string): Promise<void> {
      loading.value = true
      error.value = null
      try {
        const response = await apiLogin({ identifier, password })
        token.value = response.jwt
        user.value = response.user
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

    async function logout(): Promise<void> {
      token.value = null
      user.value = null
    }

    return {
      ...toRefs({
        token,
        user,
        loading,
        error,
      }),
      isAuthenticated,
      login,
      logout,
    }
  },
  {
    persist: true,
  },
)
