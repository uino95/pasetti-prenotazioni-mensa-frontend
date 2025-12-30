<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import LoginForm from '@/components/LoginForm.vue'
import { useAuth } from '@/composables/useAuth'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const { login, error: authError } = useAuth()
const isLoading = ref(false)

const error = ref<string | null>(null)

const handleLogin = async (identifier: string, password: string) => {
  error.value = null
  try {
    isLoading.value = true
    await login(identifier.toLowerCase(), password)
    const redirect = (route.query.redirect as string) || '/menu'
    router.push(redirect)
  } catch (err: unknown) {
    console.error(err)
    error.value = authError.value || t('auth.loginError')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
      <h1 class="text-2xl font-bold text-center text-gray-900 mb-6">
        {{ t('app.name') }}
      </h1>
      <LoginForm @submit="handleLogin" :is-loading="isLoading" />
      <div v-if="error" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-sm text-red-800">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
