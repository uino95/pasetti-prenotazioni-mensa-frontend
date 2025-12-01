import { createRouter, createWebHistory } from 'vue-router'
import { authGuard, loginGuard, orderGuard } from './guards'

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
      beforeEnter: [authGuard, orderGuard],
    },
    {
      path: '/',
      redirect: '/order',
    },
  ],
})

export default router
