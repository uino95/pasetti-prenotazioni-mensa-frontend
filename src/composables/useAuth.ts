import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

/**
 * Composable that provides reactive access to the auth store.
 * Handles storeToRefs internally to maintain reactivity when destructuring.
 */
export function useAuth() {
  const authStore = useAuthStore()
  const { token, user, loading, error, isAuthenticated } = storeToRefs(authStore)

  const login = async (identifier: string, password: string) => {
    await authStore.login(identifier, password)
  }

  const logout = async () => {
    await authStore.logout()
    await router.push('/login')
  }

  return {
    // Reactive state
    token,
    user,
    loading,
    error,
    isAuthenticated,
    // Methods
    login,
    logout,
  }
}
