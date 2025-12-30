<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Product, CreateProductRequest, UpdateProductRequest } from '@/api/admin/products'
import type { Category } from '@/api/admin/menus'
import { Button } from '@/components/ui/button'

interface Props {
  product?: Product | null
  categories: Category[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: CreateProductRequest | UpdateProductRequest]
  cancel: []
}>()

const { t } = useI18n()

const name = ref('')
const categoryId = ref('')
const isEditMode = ref(false)

const resetForm = () => {
  name.value = ''
  categoryId.value = ''
}

const handleSubmit = () => {
  if (!categoryId.value) {
    alert(t('admin.products.categoryRequired'))
    return
  }
  if (isEditMode.value && props.product) {
    const updateData: UpdateProductRequest = {
      name: name.value,
      category: categoryId.value,
    }
    emit('submit', updateData)
  } else {
    const createData: CreateProductRequest = {
      name: name.value,
      category: categoryId.value,
    }
    emit('submit', createData)
  }
}

const handleCancel = () => {
  resetForm()
  emit('cancel')
}

onMounted(() => {
  if (props.product) {
    isEditMode.value = true
    name.value = props.product.name || ''
    categoryId.value = props.product.category?.documentId || ''
  } else {
    isEditMode.value = false
    resetForm()
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="handleCancel"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            {{ isEditMode ? t('admin.products.editProduct') : t('admin.products.createProduct') }}
          </h3>
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
                {{ t('admin.products.name') }} *
              </label>
              <input
                id="name"
                v-model="name"
                type="text"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label for="category" class="block text-sm font-medium text-gray-700 mb-1">
                {{ t('admin.products.category') }} *
              </label>
              <select
                id="category"
                v-model="categoryId"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{{ t('admin.products.selectCategory') }}</option>
                <option
                  v-for="category in categories"
                  :key="category.documentId"
                  :value="category.documentId"
                >
                  {{ category.name }}
                </option>
              </select>
            </div>
            <div class="flex justify-end gap-3 pt-4">
              <Button type="button" @click="handleCancel" variant="secondary">
                {{ t('admin.cancel') }}
              </Button>
              <Button type="submit">
                {{ isEditMode ? t('admin.save') : t('admin.create') }}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped></style>
