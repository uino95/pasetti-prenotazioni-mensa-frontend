import { useAuthStore } from '@/stores/auth'
import { toRef } from 'vue'

export function useAuth() {
  const authStore = useAuthStore()

  const login = async (identifier: string, password: string) => {
    await authStore.login(identifier, password)
  }

  const logout = async () => {
    await authStore.logout()
  }

  return {
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated,
    loading: authStore.loading,
    error: toRef(authStore.error),
    login,
    logout,
  }
}
