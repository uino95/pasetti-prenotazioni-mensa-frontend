<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const props = defineProps<{
  isLoading: boolean
}>()
const emit = defineEmits<{
  (e: 'submit', identifier: string, password: string): void
}>()

const identifier = ref('')
const password = ref('')

const handleSubmit = () => {
  if (!identifier.value || !password.value) {
    return
  }
  emit('submit', identifier.value, password.value)
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <label for="identifier" class="block text-sm font-medium text-gray-700 mb-1">
        {{ t('auth.username') }}
      </label>
      <input
        id="identifier"
        v-model="identifier"
        type="text"
        required
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        :disabled="props.isLoading"
      />
    </div>
    <div>
      <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
        {{ t('auth.password') }}
      </label>
      <input
        id="password"
        v-model="password"
        type="password"
        required
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        :disabled="props.isLoading"
      />
    </div>
    <button
      type="submit"
      :disabled="props.isLoading"
      class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {{ props.isLoading ? t('auth.loggingIn') : t('auth.login') }}
    </button>
  </form>
</template>

<style scoped></style>
