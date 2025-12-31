<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'

const { t } = useI18n()
const props = defineProps<{
  isLoading: boolean
}>()
const emit = defineEmits<{
  (e: 'submit', identifier: string, password: string): void
}>()

const identifier = ref('')

const handleSubmit = () => {
  if (!identifier.value) {
    return
  }
  emit(
    'submit',
    identifier.value.trim(),
    identifier.value.trim().toLowerCase().split(' ').join('.'),
  )
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
    <Button type="submit" :disabled="props.isLoading" class="w-full">
      {{ props.isLoading ? t('auth.loggingIn') : t('auth.login') }}
    </Button>
  </form>
</template>

<style scoped></style>
