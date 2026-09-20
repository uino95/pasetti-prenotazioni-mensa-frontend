import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { isAdmin, isSupplier } from '@/utils/role'

export function authGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (isSupplier()){
    next({name: 'admin-schedule'})
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

export function adminGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (!isAdmin() && !isSupplier()) {
    // Redirect non-admin users to order page
    next({ name: 'order' })
  } else {
    next()
  }
}

export function onlyAdminGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (!isSupplier()) {
    // Redirect non-admin users to order page
    next({ name: 'admin-schedule' })
  } else if (!isAdmin()){
    next({name: 'order'})
  } else {
    next();
  }
}

export function guestAreaGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (!authStore.user?.canInviteGuest) {
    next({ name: 'order' })
  } else {
    next()
  }
}
