<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useRouterLoading } from '@/composables/useRouterLoading'
import { Button } from '@/components/ui/button'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { hideView } = useRouterLoading()

const navItems = [
  { name: 'admin.users.title', route: 'admin-users', icon: 'users' },
  { name: 'admin.menus.title', route: 'admin-menus', icon: 'calendar' },
  { name: 'admin.products.title', route: 'admin-products', icon: 'box' },
]

const isActive = (routeName: string) => {
  return route.name === routeName
}

const navigateTo = (routeName: string) => {
  router.push({ name: routeName })
}
</script>

<template>
  <div class="bg-gray-50 h-[calc(100vh-73px)] flex flex-col">
    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <aside class="w-64 bg-white shadow-sm flex flex-col">
        <nav class="p-4 space-y-2 overflow-y-auto">
          <Button
            v-for="item in navItems"
            :key="item.route"
            @click="navigateTo(item.route)"
            :variant="isActive(item.route) ? 'secondary' : 'ghost'"
            class="w-full justify-start"
          >
            <div class="flex items-center gap-3">
              <svg
                v-if="item.icon === 'users'"
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <svg
                v-else-if="item.icon === 'calendar'"
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <svg
                v-else-if="item.icon === 'box'"
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <span>{{ t(item.name) }}</span>
            </div>
          </Button>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 p-6 overflow-y-auto">
        <div
          :class="{ 'opacity-0 pointer-events-none': hideView }"
          class="transition-opacity duration-0"
        >
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped></style>
