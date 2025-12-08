import { createRouter, createWebHistory } from 'vue-router'
import { authGuard, loginGuard, orderGuard, adminGuard } from './guards'

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

export default router
