<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Deadline, Menu } from '@/api/admin/menus'
import type { Product } from '@/api/admin/products'
import { useDebounceFn } from '@vueuse/core'

interface Props {
  menu: Menu | null
  availableProducts: Product[]
  totalAvailableProducts: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  'update:deadline': [deadline: Deadline]
  'add-product': [productId: string]
  'remove-product': [productId: string]
  'search-products': [searchQuery: string, start: number]
}>()

const { t } = useI18n()

const deadline = ref<string>()
const searchQuery = ref('')
const timeInputRef = ref<HTMLInputElement | null>(null)

watch(
  () => props.menu,
  (newMenu) => {
    if (newMenu) {
      deadline.value = newMenu.deadline || ''
    }
  },
  { immediate: true },
)

const handleDeadlineChange = () => {
  if (deadline.value) {
    emit('update:deadline', (deadline.value + ':00') as Deadline)
  }
}

const handleTimeClick = () => {
  // Use showPicker() API if available (modern browsers)
  if (timeInputRef.value && 'showPicker' in timeInputRef.value) {
    timeInputRef.value.showPicker()
  }
}

const handleAddProduct = (productId: string) => {
  emit('add-product', productId)
}

const handleRemoveProduct = (productId: string) => {
  emit('remove-product', productId)
}

const searchProducts = useDebounceFn(() => {
  emit('search-products', searchQuery.value, 0)
}, 500)

const loadMoreProducts = () => {
  emit('search-products', searchQuery.value, props.availableProducts.length)
}

const menuProductIds = computed(() => {
  return new Set(props.menu?.items?.map((item) => item.documentId) || [])
})

const availableProductsToAdd = computed(() => {
  return props.availableProducts.filter((p) => !menuProductIds.value.has(p.documentId))
})

const menuItemsByCategory = computed(() => {
  if (!props.menu?.items) return []
  const grouped = new Map<string, typeof props.menu.items>()
  props.menu.items.forEach((item) => {
    const categoryName = item.category?.name || 'Altro'
    if (!grouped.has(categoryName)) {
      grouped.set(categoryName, [])
    }
    grouped.get(categoryName)!.push(item)
  })
  return Array.from(grouped.entries()).map(([category, items]) => ({
    category,
    items,
  }))
})
</script>

<template>
  <div v-if="!menu" class="text-center py-8">
    <p class="text-gray-600">{{ t('admin.menus.noMenuForDate') }}</p>
  </div>

  <div v-else class="space-y-6">
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-lg">
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          {{ t('admin.menus.deadline') }}
        </label>
        <input
          ref="timeInputRef"
          v-model="deadline"
          type="time"
          @change="handleDeadlineChange"
          @click="handleTimeClick"
          :disabled="loading"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        />
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        {{ t('admin.menus.currentItems') }}
      </h3>
      <div v-if="menuItemsByCategory.length === 0" class="text-gray-500 text-center py-4">
        {{ t('admin.menus.noItems') }}
      </div>
      <div v-else class="space-y-4">
        <div v-for="categoryGroup in menuItemsByCategory" :key="categoryGroup.category">
          <h4 class="text-sm font-medium text-gray-700 mb-2">{{ categoryGroup.category }}</h4>
          <div class="space-y-2">
            <div
              v-for="item in categoryGroup.items"
              :key="item.documentId"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <span class="text-gray-900">{{ item.name }}</span>
              <button
                @click="handleRemoveProduct(item.documentId)"
                :disabled="loading"
                class="text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                {{ t('admin.remove') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        {{ t('admin.menus.addProducts') }}
      </h3>
      <div class="mb-4">
        <input
          v-model="searchQuery"
          @input="searchProducts"
          type="text"
          :placeholder="t('admin.menus.searchProducts')"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div v-if="availableProductsToAdd.length === 0" class="text-gray-500 text-center py-4">
        {{ t('admin.menus.noAvailableProducts') }}
      </div>
      <div v-else class="space-y-2">
        <button
          v-for="product in availableProductsToAdd"
          :key="product.documentId"
          @click="handleAddProduct(product.documentId)"
          :disabled="loading"
          class="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
        >
          <div class="flex items-center justify-between">
            <span class="text-gray-900">{{ product.name }}</span>
            <span class="text-sm text-gray-500">{{ product.category?.name }}</span>
          </div>
        </button>
        <div v-if="availableProducts.length < totalAvailableProducts" class="flex justify-center">
          <button
            @click="loadMoreProducts"
            :disabled="loading"
            class="text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
          >
            {{ t('utils.loadMore') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
