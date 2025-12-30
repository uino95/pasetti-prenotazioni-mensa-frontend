<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import MenuCard from '@/components/MenuCard.vue'
import DeadlineBanner from '@/components/DeadlineBanner.vue'
import { useMenu } from '@/composables/useMenu'
import { useOrder } from '@/composables/useOrder'
import type { MenuItem } from '@/api/admin/menus'
import router from '@/router'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { Button } from '@/components/ui/button'

const { t } = useI18n()
const { items, deadline, canOrder, loading, error, fetchMenu, menu } = useMenu()
const {
  currentOrder,
  loading: orderLoading,
  error: orderError,
  fetchCurrentOrder,
  placeOrder,
  updateOrder,
} = useOrder(() => canOrder.value)

const selectedItems = ref<MenuItem[]>([])
const note = ref<string>('')

const selectedItemIds = computed(() => selectedItems.value.map((item) => item.documentId))

const itemsByCategory = computed(() => {
  const grouped = new Map<string, MenuItem[]>()
  items.value.forEach((item) => {
    const categoryName = item.category?.name || 'Altro'
    if (!grouped.has(categoryName)) {
      grouped.set(categoryName, [])
    }
    grouped.get(categoryName)!.push(item)
  })
  // Sort the groups by the order of the categories
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sortedGrouped = Array.from(grouped.entries()).sort(([_a, aItems], [_b, bItems]) => {
    // Try to get the category order for each group (first item's category order)
    const aOrder = aItems[0]?.category?.order ?? 9999
    const bOrder = bItems[0]?.category?.order ?? 9999
    return aOrder - bOrder
  })
  return sortedGrouped.map(([category, items]) => ({
    category,
    items,
  }))
})

const toggleItem = (itemId: string) => {
  if (!canOrder.value) return

  const item = items.value.find((i) => i.documentId === itemId)
  if (!item) return

  const categoryId = item.category?.documentId || null
  const isAlreadySelected = selectedItems.value.some((i) => i.documentId === itemId)

  if (isAlreadySelected) {
    // If already selected, deselect it
    selectedItems.value = selectedItems.value.filter((i) => i.documentId !== itemId)
  } else {
    // Remove any previously selected item from the same category
    selectedItems.value = selectedItems.value.filter(
      (selectedItem) => (selectedItem.category?.documentId || null) !== categoryId,
    )
    // Add the newly selected item
    selectedItems.value.push(item)
  }
}

const handlePlaceOrder = async () => {
  if (selectedItems.value.length === 0 || !menu.value?.documentId) return

  try {
    if (currentOrder.value) {
      await updateOrder(currentOrder.value.documentId, selectedItemIds.value, note.value)
    } else {
      await placeOrder(selectedItemIds.value, menu.value.documentId, note.value)
    }
    router.push({ name: 'order' })
  } catch (err) {
    console.error(err)
    // Error is handled by the store/composable
  }
}

onMounted(async () => {
  await Promise.all([fetchMenu(), fetchCurrentOrder()])
  if (currentOrder.value) {
    const orderItemIds = currentOrder.value.items.map((item) => item.documentId)
    selectedItems.value = items.value.filter((item) => orderItemIds.includes(item.documentId))
    note.value = currentOrder.value.note || ''
  }
})
</script>

<template>
  <main class="max-w-4xl mx-auto px-4 py-6">
    <DeadlineBanner
      :loading="loading"
      :deadline="deadline"
      :can-order="canOrder"
      :has-order="!!currentOrder"
      :show-order-link="true"
    />

    <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-800">{{ error }}</p>
    </div>

    <div v-if="orderError" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-800">{{ orderError }}</p>
    </div>

    <div v-else-if="!loading && items.length === 0" class="text-center py-8">
      <p class="text-gray-600">{{ t('menu.noItems') }}</p>
    </div>

    <div v-else class="space-y-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">
        {{ t('menu.title') }}
      </h2>

      <div v-if="loading">
        <div v-for="i in 3" :key="i" class="mb-6 space-y-0.5">
          <SkeletonLoader width="150px" height="20px" customClass="mb-4" />
          <SkeletonLoader v-for="i in 5" :key="i" variant="rectangular" height="35px" />
        </div>
      </div>

      <div v-for="categoryGroup in itemsByCategory" :key="categoryGroup.category" class="mb-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-2 px-2">
          {{ categoryGroup.category }}
        </h3>

        <div class="overflow-x-auto">
          <table
            class="w-full border-collapse bg-white rounded-lg shadow-sm border border-gray-200"
          >
            <tbody>
              <MenuCard
                v-for="item in categoryGroup.items"
                :key="item.documentId"
                :item="item"
                :category="categoryGroup.category"
                :selected="selectedItems.some((i) => i.documentId === item.documentId)"
                :disabled="!canOrder"
                @toggle="toggleItem"
              />
            </tbody>
          </table>
        </div>
      </div>

      <div
        v-if="canOrder && selectedItems.length > 0"
        class="sticky bottom-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 space-y-4"
      >
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
          />
        </div>
        <div class="flex items-center justify-between">
          <p class="text-gray-700">{{ selectedItems.length }} {{ t('order.selectedItems') }}</p>
          <Button @click="handlePlaceOrder" :disabled="orderLoading">
            {{ orderLoading ? t('order.placing') : t('order.placeOrder') }}
          </Button>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped></style>
