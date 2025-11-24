<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { MenuItem } from '@/api/menu'

const { t } = useI18n()

const props = defineProps<{
  selectedItems: MenuItem[]
  canEdit: boolean
  loading?: boolean
  initialNote?: string | null
  hasExistingOrder?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', itemIds: string[], note: string): void
  (e: 'update', itemIds: string[], note: string): void
}>()

const note = ref(props.initialNote || '')

const selectedItemIds = computed(() => props.selectedItems.map((item) => item.documentId))

const handleSubmit = () => {
  if (props.selectedItems.length === 0) {
    return
  }
  emit('submit', selectedItemIds.value, note.value)
}

const handleUpdate = () => {
  if (props.selectedItems.length === 0) {
    return
  }
  emit('update', selectedItemIds.value, note.value)
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">
        {{ t('order.selectedItems') }}
      </h3>
      <div v-if="selectedItems.length === 0" class="text-gray-500">
        {{ t('order.noItemsSelected') }}
      </div>
      <ul v-else class="space-y-2">
        <li
          v-for="item in selectedItems"
          :key="item.documentId"
          class="flex items-center justify-between p-2 bg-gray-50 rounded"
        >
          <span class="text-gray-900">{{ item.name }}</span>
          <span class="text-sm text-gray-600">{{ item.category }}</span>
        </li>
      </ul>
    </div>

    <div>
      <label for="note" class="block text-sm font-medium text-gray-700 mb-1">
        {{ t('order.note') }}
      </label>
      <textarea
        id="note"
        v-model="note"
        :placeholder="t('order.notePlaceholder')"
        rows="3"
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        :disabled="!canEdit || loading"
      />
    </div>

    <button
      v-if="canEdit && !hasExistingOrder"
      @click="handleSubmit"
      :disabled="selectedItems.length === 0 || loading"
      class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {{ loading ? t('order.placing') : t('order.placeOrder') }}
    </button>
    <button
      v-else-if="canEdit && hasExistingOrder"
      @click="handleUpdate"
      :disabled="selectedItems.length === 0 || loading"
      class="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {{ loading ? t('order.updating') : t('order.updateOrder') }}
    </button>
  </div>
</template>

<style scoped></style>
