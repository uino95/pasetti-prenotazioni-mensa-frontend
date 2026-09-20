<script setup lang="ts">
import { computed } from 'vue'
import { type Order, type OrderItemFullyPopulated } from '@/api/orders'
import type { Category } from '@/api/admin/menus'
import { useI18n } from 'vue-i18n'

interface Props {
  orders: Order<OrderItemFullyPopulated>[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const { t } = useI18n()

const ordersByCategory = computed(() => {
  const itemsByCategory: Record<string, Category & { items: Record<string, number> }> = {}
  for (const order of props.orders) {
    if (order.items && Array.isArray(order.items)) {
      for (const item of order.items) {
        const itemName = item.name
        const category = item.category
        if (!category) continue
        const categoryId = category.documentId
        const categoryName = category.name
        const categoryOrder = category.order

        if (!itemsByCategory[categoryId]) {
          itemsByCategory[categoryId] = {
            documentId: categoryId,
            name: categoryName,
            order: categoryOrder,
            items: {},
          }
        }

        itemsByCategory[categoryId].items[itemName] =
          (itemsByCategory[categoryId].items[itemName] || 0) + 1
      }
    }
  }

  // Sort categories by order field
  const sortedCategories = Object.values(itemsByCategory).sort((a, b) => a.order - b.order)
  return sortedCategories
})
</script>
<template>
  <div
    v-if="!loading && ordersByCategory.length"
    class="flex flex-col gap-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4 w-full"
  >
    <h1 class="text-2xl font-semibold">{{ t('admin.orders.summary_title') }}</h1>
    <ul>
      <li v-for="category in ordersByCategory" :key="category.documentId" class="flex flex-col">
        <h2 class="text-lg font-semibold">{{ category.name }}</h2>
        <table class="ml-4 border-separate border-spacing-y-4">
          <tr v-for="item in Object.entries(category.items)" :key="item[0]">
            <td class="w-10 font-semibold">{{ item[1] }}</td>
            <td>{{ item[0] }}</td>
          </tr>
        </table>
      </li>
    </ul>
  </div>
</template>
