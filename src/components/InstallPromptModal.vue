<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePWAInstall } from '@/composables/usePWAInstall'
import { useAuth } from '@/composables/useAuth'

const { t } = useI18n()
const {
  install,
  dismiss,
  isInstalled,
  isInstallable,
  installPrompt,
  isDismissed,
  isCheckingInstallation,
} = usePWAInstall()
const { isAuthenticated } = useAuth()

// Show modal only if user is authenticated, not installed, not dismissed, and installation check is complete
// Wait for installation check to complete to avoid showing modal if app is already installed
const showModal = computed(() => {
  if (!isAuthenticated.value) {
    return false
  }
  // Wait for installation check to complete
  if (isCheckingInstallation.value) {
    return false
  }
  if (isInstalled.value) {
    return false
  }
  // Show if not dismissed - this allows proactive display
  return !isDismissed.value
})
const canInstall = computed(() => isInstallable.value && installPrompt.value !== null)

const isIOS = computed(() => {
  if (typeof window === 'undefined') return false
  const userAgent = window.navigator.userAgent.toLowerCase()
  return /iphone|ipad|ipod/.test(userAgent)
})

const isStandaloneIOS = computed(() => {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true
})

const handleInstall = async () => {
  const success = await install()
  if (success) {
    // Modal will automatically hide when isInstalled becomes true
    return
  }
}

const handleDismiss = () => {
  dismiss()
}
</script>

<template>
  <div
    v-if="showModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    @click.self="handleDismiss"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative" @click.stop>
      <!-- Close button -->
      <button
        @click="handleDismiss"
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        :aria-label="t('install.close')"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <!-- Content -->
      <div class="pr-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">
          {{ t('install.title') }}
        </h2>

        <p class="text-gray-600 mb-6">
          {{ t('install.description') }}
        </p>

        <!-- iOS Safari instructions - always visible on iOS -->
        <div
          v-if="isIOS && !isStandaloneIOS"
          class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
        >
          <p class="text-sm text-blue-800 font-medium mb-2">
            {{ t('install.iosTitle') }}
          </p>
          <ol class="text-sm text-blue-700 list-decimal list-inside space-y-1">
            <li>{{ t('install.iosStep1') }}</li>
            <li>{{ t('install.iosStep2') }}</li>
            <li>{{ t('install.iosStep3') }}</li>
          </ol>
        </div>

        <!-- Manual install instructions - show when event hasn't fired (for all browsers) -->
        <div
          v-if="!canInstall && !isIOS"
          class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
        >
          <p class="text-sm text-blue-800 font-medium mb-2">
            {{ t('install.manualTitle') }}
          </p>
          <ol class="text-sm text-blue-700 list-decimal list-inside space-y-1">
            <li>{{ t('install.manualStep1') }}</li>
            <li>{{ t('install.manualStep2') }}</li>
            <li>{{ t('install.manualStep3') }}</li>
          </ol>
        </div>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-3">
          <button
            v-if="!isIOS || isStandaloneIOS"
            @click="handleInstall"
            :disabled="!canInstall"
            :class="[
              'flex-1 px-6 py-3 rounded-lg transition-colors font-medium',
              canInstall
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed',
            ]"
          >
            {{ t('install.installButton') }}
          </button>
          <button
            @click="handleDismiss"
            class="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            {{ t('install.dismissButton') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
