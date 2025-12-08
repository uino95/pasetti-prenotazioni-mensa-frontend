<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import { usePWAInstall } from '@/composables/usePWAInstall'
import { isAdmin } from '@/utils/role'
import InstallPromptModal from '@/components/InstallPromptModal.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { isAuthenticated, logout } = useAuth()
const { isInstallable, isInstalled, resetDismiss } = usePWAInstall()
const userIsAdmin = computed(() => isAdmin())

const isAdminRoute = computed(() => {
  return route.path.startsWith('/admin')
})

const showHeader = computed(() => {
  return isAuthenticated.value && route.name !== 'login'
})

// Show install button if app is installable but was dismissed or not installed
const showInstallButton = computed(() => {
  return isInstallable.value && !isInstalled.value
})

const handleInstallClick = () => {
  console.log('[App] Install button clicked, resetting dismissal')
  resetDismiss()
  // The modal will show automatically since dismissal is reset
  // Force a small delay to ensure reactivity updates
  setTimeout(() => {
    console.log('[App] Dismissal reset complete')
  }, 100)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header v-if="showHeader" class="bg-white shadow-sm">
      <div
        :class="isAdminRoute ? '' : 'max-w-4xl'"
        class="w-full mx-auto px-4 py-4 flex justify-between items-center"
      >
        <h1 class="text-xl font-bold text-gray-900">{{ t('app.name') }}</h1>
        <div class="flex items-center gap-4">
          <button
            v-if="userIsAdmin"
            @click="router.push(isAdminRoute ? '/' : '/admin')"
            class="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {{ isAdminRoute ? t('admin.logout') : t('admin.title') }}
          </button>
          <button
            v-if="showInstallButton"
            @click="handleInstallClick"
            class="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            :title="t('install.showPrompt')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            {{ t('install.installButton') }}
          </button>
          <button @click="logout" class="text-sm text-gray-600 hover:text-gray-900">
            {{ t('auth.logout') }}
          </button>
        </div>
      </div>
    </header>
    <RouterView />
    <InstallPromptModal />
  </div>
</template>

<style scoped></style>
