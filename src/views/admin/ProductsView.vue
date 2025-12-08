<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAdminProducts } from '@/composables/useAdminProducts'
import ProductForm from '@/components/admin/ProductForm.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import type { Product, CreateProductRequest, UpdateProductRequest } from '@/api/admin/products'
import { useDebounceFn } from '@vueuse/core'

const { t } = useI18n()
const {
  products,
  categories,
  loading,
  error,
  totalProducts,
  fetchProducts,
  fetchCategories,
  createNewProduct,
  updateExistingProduct,
  removeProduct,
} = useAdminProducts()

const showProductForm = ref(false)
const editingProduct = ref<Product | null>(null)
const showDeleteDialog = ref(false)
const productToDelete = ref<Product | null>(null)
const searchQuery = ref('')

const handleCreateProduct = () => {
  editingProduct.value = null
  showProductForm.value = true
}

const handleEditProduct = (product: Product) => {
  editingProduct.value = product
  showProductForm.value = true
}

const handleDeleteProduct = (product: Product) => {
  productToDelete.value = product
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (productToDelete.value) {
    await removeProduct(productToDelete.value.documentId)
    showDeleteDialog.value = false
    productToDelete.value = null
  }
}

const handleFormSubmit = async (data: CreateProductRequest | UpdateProductRequest) => {
  try {
    if (editingProduct.value) {
      await updateExistingProduct(editingProduct.value.documentId, data as UpdateProductRequest)
    } else {
      await createNewProduct(data as CreateProductRequest)
    }
    showProductForm.value = false
    editingProduct.value = null
  } catch (err) {
    console.error('Failed to save product:', err)
  }
}

const handleFormCancel = () => {
  showProductForm.value = false
  editingProduct.value = null
}

const handleLoadMoreProducts = () => {
  fetchProducts({ pagination: { start: products.value.length }, search: searchQuery.value })
}

const searchProducts = useDebounceFn(() => {
  fetchProducts({ search: searchQuery.value })
}, 500)

onMounted(async () => {
  await Promise.all([fetchProducts(), fetchCategories()])
})
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <div class="mb-6 flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('admin.products.title') }}</h1>
      <button
        @click="handleCreateProduct"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        {{ t('admin.products.createProduct') }}
      </button>
    </div>

    <div v-if="error" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-800">{{ error }}</p>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        {{ t('admin.search') }}
      </label>
      <input
        v-model="searchQuery"
        @input="searchProducts"
        type="text"
        :placeholder="t('admin.products.searchPlaceholder')"
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <div v-if="loading && products.length === 0" class="text-center py-8">
      <p class="text-gray-600">{{ t('admin.loading') }}</p>
    </div>

    <div v-else-if="products.length === 0" class="text-center py-8">
      <p class="text-gray-600">{{ t('admin.products.noProducts') }}</p>
    </div>

    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {{ t('admin.products.name') }}
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {{ t('admin.products.category') }}
            </th>
            <th
              class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {{ t('admin.actions') }}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="product in products" :key="product.documentId" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ product.name }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
              {{ product.category?.name || '-' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button
                @click="handleEditProduct(product)"
                class="text-blue-600 hover:text-blue-900 mr-4"
              >
                {{ t('admin.edit') }}
              </button>
              <button @click="handleDeleteProduct(product)" class="text-red-600 hover:text-red-900">
                {{ t('admin.delete') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="w-full flex justify-between items-center p-4">
        <div class="flex-1"></div>
        <button
          v-if="products.length < totalProducts"
          @click="handleLoadMoreProducts()"
          class="text-blue-600 hover:text-blue-900"
        >
          {{ t('utils.loadMore') }}
        </button>
        <div v-else class="flex-1"></div>
        <div class="flex-1 text-right">{{ products.length }} / {{ totalProducts }}</div>
      </div>
    </div>

    <ProductForm
      v-if="showProductForm"
      :product="editingProduct"
      :categories="categories"
      @submit="handleFormSubmit"
      @cancel="handleFormCancel"
    />

    <ConfirmDialog
      :show="showDeleteDialog"
      :title="t('admin.products.deleteProduct')"
      :message="
        t('admin.products.deleteConfirm', {
          name: productToDelete?.name || '',
        })
      "
      @confirm="confirmDelete"
      @cancel="
        () => {
          showDeleteDialog = false
          productToDelete = null
        }
      "
    />
  </div>
</template>

<style scoped></style>
