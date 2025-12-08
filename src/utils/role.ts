import { useAuthStore } from '@/stores/auth'

/**
 * Checks if the current user has Admin role
 * @returns true if user is admin, false otherwise
 */
export function isAdmin(): boolean {
  const authStore = useAuthStore()

  // First check if role is in user object (preferred)
  if (authStore.user?.role) {
    return authStore.user.role.name === 'Admin'
  }

  return false
}
