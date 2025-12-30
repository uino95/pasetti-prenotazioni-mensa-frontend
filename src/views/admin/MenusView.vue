<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAdminMenus } from '@/composables/useAdminMenus'
import MenuEditor from '@/components/admin/MenuEditor.vue'
import DatePicker from '@/components/admin/DatePicker.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import type { Deadline } from '@/api/admin/menus'
import { Button } from '@/components/ui/button'

const { t } = useI18n()
const {
  currentMenu,
  availableProducts,
  totalAvailableProducts,
  loading,
  error,
  fetchMenuByDate,
  fetchAvailableProducts,
  createNewMenu,
  updateExistingMenu,
  removeMenu,
  addProductToMenu,
  removeProductFromMenu,
} = useAdminMenus()

const selectedDate = ref<Date>(new Date())
const showDeleteDialog = ref(false)
const timeInputRef = ref<HTMLInputElement | null>(null)
const deadline = ref<string | undefined>()

const selectedDateString = computed(() => {
  return selectedDate.value.toISOString().split('T')[0] || null
})

// Convert UTC time (HH:MM:SS) to local time (HH:MM) for display
const convertUtcToLocalTime = (utcTime: string, date: Date): string => {
  const parts = utcTime.split(':').map(Number)
  const hours = parts[0] ?? 0
  const minutes = parts[1] ?? 0
  const utcDate = new Date(date)
  utcDate.setUTCHours(hours, minutes, 0, 0)

  const localHours = String(utcDate.getHours()).padStart(2, '0')
  const localMinutes = String(utcDate.getMinutes()).padStart(2, '0')
  return `${localHours}:${localMinutes}`
}

const handleDateChange = async (dateString: string) => {
  if (!dateString) return
  const date = new Date(dateString)
  selectedDate.value = date
  await fetchMenuByDate(date)
  if (currentMenu.value?.deadline) {
    // Convert UTC time from backend to local time for display
    deadline.value = convertUtcToLocalTime(currentMenu.value.deadline, date)
  }
}

const handleCreateMenu = async () => {
  if (!selectedDate.value) return
  // Format date to YYYY-MM-DD for exact date match
  const year = selectedDate.value.getFullYear()
  const month = String(selectedDate.value.getMonth() + 1).padStart(2, '0')
  const day = String(selectedDate.value.getDate()).padStart(2, '0')
  const dateString = `${year}-${month}-${day}`

  try {
    await createNewMenu({
      day: dateString,
      items: [],
    })
  } catch (err) {
    console.error('Failed to create menu:', err)
  }
}

const handleTimeClick = () => {
  // Use showPicker() API if available (modern browsers)
  if (timeInputRef.value && 'showPicker' in timeInputRef.value) {
    timeInputRef.value.showPicker()
  }
}

const handleUpdateDeadline = async () => {
  if (!currentMenu.value || !deadline.value || !selectedDate.value) return

  try {
    // Create a date object with the selected date and deadline time in local timezone
    const parts = deadline.value.split(':').map(Number)
    const hours = parts[0] ?? 0
    const minutes = parts[1] ?? 0
    const localDateTime = new Date(selectedDate.value)
    localDateTime.setHours(hours, minutes, 0, 0)

    // Convert to UTC and extract time portion
    const utcHours = String(localDateTime.getUTCHours()).padStart(2, '0')
    const utcMinutes = String(localDateTime.getUTCMinutes()).padStart(2, '0')
    const utcDeadline = `${utcHours}:${utcMinutes}:00` as Deadline

    await updateExistingMenu(currentMenu.value.documentId, {
      deadline: utcDeadline,
    })
  } catch (err) {
    console.error('Failed to update deadline:', err)
  }
}

const handleAddProduct = async (productId: string) => {
  if (!currentMenu.value) return
  try {
    await addProductToMenu(currentMenu.value.documentId, productId)
  } catch (err) {
    console.error('Failed to add product:', err)
  }
}

const handleRemoveProduct = async (productId: string) => {
  if (!currentMenu.value) return
  try {
    await removeProductFromMenu(currentMenu.value.documentId, productId)
  } catch (err) {
    console.error('Failed to remove product:', err)
  }
}

const handleSearchProducts = async (searchQuery: string, start: number) => {
  await fetchAvailableProducts({ search: searchQuery, pagination: { start: start } })
}

const confirmDelete = async () => {
  if (currentMenu.value) {
    await removeMenu(currentMenu.value.documentId)
    showDeleteDialog.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchAvailableProducts(), fetchMenuByDate(selectedDate.value)])
  if (currentMenu.value?.deadline) {
    // Convert UTC time from backend to local time for display
    deadline.value = convertUtcToLocalTime(currentMenu.value.deadline, selectedDate.value)
  }
})
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-4">{{ t('admin.menus.title') }}</h1>
      <div class="flex items-center gap-4">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 w-full">
          <DatePicker
            :model-value="selectedDateString"
            :label="t('admin.menus.selectDate')"
            @update:model-value="handleDateChange"
          />
        </div>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 w-full">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {{ t('admin.menus.deadline') }}
          </label>
          <input
            ref="timeInputRef"
            v-model="deadline"
            type="time"
            @change="handleUpdateDeadline"
            @click="handleTimeClick"
            :disabled="loading"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
        </div>
      </div>
    </div>
    <div v-if="error" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-800">{{ error }}</p>
    </div>

    <div v-if="!currentMenu && !loading" class="text-center py-8">
      <p class="text-gray-600 mb-4">{{ t('admin.menus.noMenuForDate') }}</p>
      <Button @click="handleCreateMenu" :disabled="loading">
        {{ t('admin.menus.createMenu') }}
      </Button>
    </div>

    <MenuEditor
      :menu="currentMenu"
      :available-products="availableProducts"
      :total-available-products="totalAvailableProducts"
      :loading="loading"
      @add-product="handleAddProduct"
      @remove-product="handleRemoveProduct"
      @search-products="handleSearchProducts"
    />

    <ConfirmDialog
      :show="showDeleteDialog"
      :title="t('admin.menus.deleteMenu')"
      :message="t('admin.menus.deleteConfirm')"
      @confirm="confirmDelete"
      @cancel="() => (showDeleteDialog = false)"
    />
  </div>
</template>

<style scoped></style>
