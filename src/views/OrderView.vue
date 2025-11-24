<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import OrderSummary from '@/components/OrderSummary.vue'
import DeadlineBanner from '@/components/DeadlineBanner.vue'
import { useMenu } from '@/composables/useMenu'
import { useOrder } from '@/composables/useOrder'
import type { MenuItem } from '@/api/menu'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const { items, deadline, canOrder, fetchMenu } = useMenu()
const {
  currentOrder,
  loading,
  error: orderError,
  canEdit,
  fetchCurrentOrder,
  placeOrder,
  updateOrder,
} = useOrder(() => canOrder.value)

const selectedItems = ref<MenuItem[]>([])
const successMessage = ref<string | null>(null)

const initializeSelectedItems = () => {
  console.log('initializeSelectedItems')
  if (items.value.length === 0) return

  const queryItems = route.query.items as string | undefined
  if (queryItems) {
    const itemIds = queryItems.split(',')
    selectedItems.value = items.value.filter((item) => itemIds.includes(item.documentId))
  } else if (currentOrder.value) {
    const orderItemIds = currentOrder.value.items.map((item) => item.documentId)
    selectedItems.value = items.value.filter((item) => orderItemIds.includes(item.documentId))
  }
}

const handleSubmit = async (itemIds: string[], note: string) => {
  successMessage.value = null
  try {
    await placeOrder(itemIds, note)
    successMessage.value = t('order.success')
    setTimeout(() => {
      router.push({ name: 'menu' })
    }, 1000)
  } catch (err) {
    console.error(err)
    // Error is handled by the store
  }
}

const handleUpdate = async (itemIds: string[], note: string) => {
  if (!currentOrder.value) return

  successMessage.value = null
  try {
    await updateOrder(currentOrder.value.documentId, itemIds, note)
    successMessage.value = t('order.updateSuccess')
    setTimeout(() => {
      router.push({ name: 'menu' })
    }, 1000)
  } catch (err) {
    console.error(err)
    // Error is handled by the store
  }
}

watch(
  () => items.value,
  () => {
    initializeSelectedItems()
  },
  { immediate: true },
)

onMounted(async () => {
  await fetchMenu()
  await fetchCurrentOrder()
  initializeSelectedItems()
})
</script>

<template>
  <main class="max-w-4xl mx-auto px-4 py-6">
    <DeadlineBanner v-if="deadline" :deadline="deadline" :can-order="canOrder" />

    <div v-if="successMessage" class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
      <p class="text-green-800">{{ successMessage }}</p>
    </div>

    <div v-if="orderError" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-800">{{ orderError }}</p>
    </div>

    <div class="bg-white rounded-lg shadow-sm p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">
        {{ t('order.title') }}
      </h2>

      <div v-if="!canOrder && !currentOrder" class="text-center py-8">
        <p class="text-gray-600">{{ t('deadline.passed') }}</p>
        <button
          @click="router.push({ name: 'menu' })"
          class="mt-4 text-blue-600 hover:text-blue-800"
        >
          {{ t('menu.title') }}
        </button>
      </div>

      <OrderSummary
        v-else
        :selected-items="selectedItems"
        :can-edit="canEdit"
        :loading="loading"
        :initial-note="currentOrder?.note || null"
        :has-existing-order="!!currentOrder"
        @submit="handleSubmit"
        @update="handleUpdate"
      />
    </div>
  </main>
</template>

<style scoped></style>
