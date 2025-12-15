<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import DeadlineBanner from '@/components/DeadlineBanner.vue'
import { useMenu } from '@/composables/useMenu'
import { useOrder } from '@/composables/useOrder'
import type { MenuItem } from '@/api/admin/menus'
import SkeletonLoader from '@/components/SkeletonLoader.vue'

const { t } = useI18n()
const router = useRouter()
const { items, deadline, canOrder, fetchMenu } = useMenu()
const {
  currentOrder,
  loading,
  error: orderError,
  canEdit,
  fetchCurrentOrder,
} = useOrder(() => canOrder.value)

const selectedItems = ref<MenuItem[]>([])

const initializeSelectedItems = () => {
  if (items.value.length === 0 || !currentOrder.value) return

  const orderItemIds = currentOrder.value.items.map((item) => item.documentId)
  selectedItems.value = items.value.filter((item) => orderItemIds.includes(item.documentId))
}

const handleEditOrder = () => {
  router.push({ name: 'menu' })
}

onMounted(async () => {
  await Promise.all([fetchMenu(), fetchCurrentOrder()])
  initializeSelectedItems()
})
</script>

<template>
  <main class="max-w-4xl mx-auto px-4 py-6">
    <DeadlineBanner
      :loading="loading"
      :deadline="deadline"
      :can-order="canOrder"
      :has-order="!!currentOrder"
      :show-order-link="false"
    />

    <div v-if="orderError" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-800">{{ orderError }}</p>
    </div>

    <div class="bg-white rounded-lg shadow-sm p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-900">
          {{ t('order.title') }}
        </h2>
        <button
          v-if="canEdit && currentOrder && !loading"
          @click="handleEditOrder"
          class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          {{ t('order.editOrder') }}
        </button>
      </div>

      <div v-if="loading" class="space-y-2">
        <SkeletonLoader v-for="i in 3" :key="i" height="40px" />
      </div>

      <div v-else-if="!currentOrder" class="text-center py-8">
        <p class="text-gray-600 mb-4">{{ t('order.noOrder') }}</p>
        <button
          v-if="canOrder"
          @click="router.push({ name: 'menu' })"
          class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {{ t('menu.title') }}
        </button>
      </div>

      <template v-else>
        <div>
          <div v-if="currentOrder?.items.length === 0" class="text-gray-500">
            {{ t('order.noItemsSelected') }}
          </div>
          <ul v-else class="space-y-2">
            <li
              v-for="item in selectedItems"
              :key="item.documentId"
              class="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <span class="text-gray-900">{{ item.name }}</span>
              <span class="text-sm text-gray-600">{{ item.category.name }}</span>
            </li>
          </ul>
        </div>
        <div class="mt-4">
          <p class="text-gray-700 font-medium mb-1">{{ t('order.note') }}:</p>
          <p class="text-gray-600 whitespace-pre-wrap">{{ currentOrder?.note }}</p>
        </div>
      </template>
    </div>
  </main>
</template>

<style scoped></style>
