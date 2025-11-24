<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'

const { t } = useI18n()
const route = useRoute()
const { isAuthenticated, logout } = useAuth()

const showHeader = computed(() => isAuthenticated && route.name !== 'login')
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header v-if="showHeader" class="bg-white shadow-sm">
      <div class="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 class="text-xl font-bold text-gray-900">{{ t('app.name') }}</h1>
        <button @click="logout" class="text-sm text-gray-600 hover:text-gray-900">
          {{ t('auth.logout') }}
        </button>
      </div>
    </header>
    <RouterView />
  </div>
</template>

<style scoped></style>
