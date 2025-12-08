import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getCurrentOrder } from '@/api/orders'
import { isAdmin } from '@/utils/role'

export function authGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
}

export function loginGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const authStore = useAuthStore()
  if (authStore.isAuthenticated) {
    next({ name: 'order' })
  } else {
    next()
  }
}

export async function orderGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const authStore = useAuthStore()
  if (!authStore.user?.documentId) {
    next({ name: 'menu' })
    return
  }

  try {
    const order = await getCurrentOrder(authStore.user.documentId)
    if (!order) {
      next({ name: 'menu' })
    } else {
      next()
    }
  } catch (error: unknown) {
    console.error(error)
    // If there's an error fetching the order, redirect to menu
    next({ name: 'menu' })
  }
}

export function adminGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (!isAdmin()) {
    // Redirect non-admin users to order page
    next({ name: 'order' })
  } else {
    next()
  }
}
