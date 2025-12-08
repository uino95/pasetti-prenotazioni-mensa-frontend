<script setup lang="ts">
import { computed } from 'vue'
import type { MenuItem } from '@/api/menu'

const props = defineProps<{
  item: MenuItem
  selected: boolean
  disabled?: boolean
  category: string
}>()

const emit = defineEmits<{
  (e: 'toggle', itemId: string): void
}>()

const handleToggle = () => {
  if (props.disabled) return
  emit('toggle', props.item.documentId)
}

// Create a unique radio group name based on category
const radioGroupName = computed(() => `category-${props.category}`)
</script>

<template>
  <tr
    class="border-b border-gray-200 transition-colors cursor-pointer"
    :class="
      selected
        ? 'bg-blue-50 hover:bg-blue-100'
        : disabled
          ? 'bg-gray-50 opacity-60 cursor-not-allowed'
          : 'hover:bg-gray-50'
    "
    @click="handleToggle"
  >
    <td class="px-4 py-2 w-12 align-middle">
      <div class="flex items-center justify-center">
        <input
          type="radio"
          :name="radioGroupName"
          :checked="selected"
          :disabled="disabled"
          @change="handleToggle"
          @click.stop
          class="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      </div>
    </td>
    <td class="px-4 py-2 font-medium text-gray-900 align-middle">{{ item.name }}</td>
  </tr>
</template>

<style scoped></style>
