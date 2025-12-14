import { createRouter, createWebHistory } from 'vue-router'
import { authGuard, loginGuard, adminGuard } from './guards'
import { useRouterLoading } from '@/composables/useRouterLoading'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      beforeEnter: loginGuard,
    },
    {
      path: '/menu',
      name: 'menu',
      component: () => import('@/views/MenuView.vue'),
      beforeEnter: authGuard,
    },
    {
      path: '/order',
      name: 'order',
      component: () => import('@/views/OrderView.vue'),
      beforeEnter: authGuard,
    },
    {
      path: '/admin',
      component: () => import('@/views/admin/AdminLayout.vue'),
      beforeEnter: adminGuard,
      children: [
        {
          path: '',
          redirect: '/admin/users',
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('@/views/admin/UsersView.vue'),
        },
        {
          path: 'menus',
          name: 'admin-menus',
          component: () => import('@/views/admin/MenusView.vue'),
        },
        {
          path: 'products',
          name: 'admin-products',
          component: () => import('@/views/admin/ProductsView.vue'),
        },
      ],
    },
    {
      path: '/',
      redirect: '/order',
    },
  ],
})

// Track loading state during navigation
const { setLoading } = useRouterLoading()

router.beforeEach((to, from, next) => {
  // Only show loading if navigating to a different route
  if (to.path !== from.path) {
    // Set loading immediately - this will increment routeKey and unmount old route
    setLoading(true)
  }
  next()
})

router.afterEach(() => {
  // Hide loading when route is ready
  setLoading(false)
})

router.onError((error) => {
  console.error('Router error:', error)
  setLoading(false)
})

export default router
