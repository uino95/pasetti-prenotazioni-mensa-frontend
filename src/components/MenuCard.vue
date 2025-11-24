<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { MenuItem } from '@/api/menu'

const { t } = useI18n()

const props = defineProps<{
  item: MenuItem
  selected: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle', itemId: string): void
}>()

const handleToggle = () => {
  emit('toggle', props.item.documentId)
}
</script>

<template>
  <div
    class="border rounded-lg p-4 cursor-pointer transition-all"
    :class="
      selected
        ? 'border-blue-500 bg-blue-50 shadow-md'
        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
    "
    @click="handleToggle"
  >
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <h3 class="font-semibold text-gray-900 mb-1">{{ item.name }}</h3>
        <p class="text-sm text-gray-600">{{ t('menu.category') }}: {{ item.category }}</p>
      </div>
      <input
        type="checkbox"
        :checked="selected"
        @change="handleToggle"
        @click.stop
        class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
      />
    </div>
  </div>
</template>

<style scoped></style>
