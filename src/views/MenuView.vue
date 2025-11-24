<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import MenuCard from '@/components/MenuCard.vue'
import DeadlineBanner from '@/components/DeadlineBanner.vue'
import { useMenu } from '@/composables/useMenu'
import { useOrder } from '@/composables/useOrder'
import type { MenuItem } from '@/api/menu'

const { t } = useI18n()
const router = useRouter()
const { items, deadline, canOrder, loading, error, fetchMenu } = useMenu()
const { currentOrder, fetchCurrentOrder, canEdit } = useOrder(() => canOrder.value)

const selectedItems = ref<MenuItem[]>([])

const selectedItemIds = computed(() => selectedItems.value.map((item) => item.documentId))

const itemsByCategory = computed(() => {
  const grouped = new Map<string, MenuItem[]>()
  items.value.forEach((item) => {
    const category = item.category || 'Altro'
    if (!grouped.has(category)) {
      grouped.set(category, [])
    }
    grouped.get(category)!.push(item)
  })
  return Array.from(grouped.entries()).map(([category, items]) => ({
    category,
    items,
  }))
})

const toggleItem = (itemId: string) => {
  if (!canOrder.value) return

  const item = items.value.find((i) => i.documentId === itemId)
  if (!item) return

  const index = selectedItems.value.findIndex((i) => i.documentId === itemId)
  if (index >= 0) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(item)
  }
}

const handlePlaceOrder = () => {
  if (selectedItems.value.length === 0) return
  router.push({
    name: 'order',
    query: { items: selectedItemIds.value.join(',') },
  })
}

const handleViewOrder = () => {
  router.push({ name: 'order' })
}

onMounted(async () => {
  await fetchMenu()
  await fetchCurrentOrder()
  if (currentOrder.value) {
    const orderItemIds = currentOrder.value.items.map((item) => item.documentId)
    selectedItems.value = items.value.filter((item) => orderItemIds.includes(item.documentId))
  }
})
</script>

<template>
  <main class="max-w-4xl mx-auto px-4 py-6">
    <DeadlineBanner v-if="deadline" :deadline="deadline" :can-order="canOrder" />

    <div
      v-if="currentOrder && canEdit"
      class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
    >
      <div class="flex items-center justify-between">
        <p class="text-blue-800">
          {{ t('order.title') }}: {{ currentOrder.items.length }} {{ t('order.selectedItems') }}
        </p>
        <button
          @click="handleViewOrder"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          {{ t('order.updateOrder') }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-600">{{ t('menu.loading') }}</p>
    </div>

    <div v-else-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-800">{{ error }}</p>
    </div>

    <div v-else-if="items.length === 0" class="text-center py-8">
      <p class="text-gray-600">{{ t('menu.noItems') }}</p>
    </div>

    <div v-else class="space-y-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">
        {{ t('menu.title') }}
      </h2>

      <div v-for="categoryGroup in itemsByCategory" :key="categoryGroup.category" class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
          {{ categoryGroup.category }}
        </h3>
        <div class="grid gap-4 md:grid-cols-2">
          <MenuCard
            v-for="item in categoryGroup.items"
            :key="item.documentId"
            :item="item"
            :selected="selectedItems.some((i) => i.documentId === item.documentId)"
            @toggle="toggleItem"
          />
        </div>
      </div>

      <div
        v-if="canOrder && selectedItems.length > 0"
        class="sticky bottom-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200"
      >
        <div class="flex items-center justify-between">
          <p class="text-gray-700">{{ selectedItems.length }} {{ t('order.selectedItems') }}</p>
          <button
            @click="handlePlaceOrder"
            class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {{ t('order.placeOrder') }}
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped></style>
