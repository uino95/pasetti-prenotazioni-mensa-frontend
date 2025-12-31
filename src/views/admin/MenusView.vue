<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAdminMenus } from '@/composables/useAdminMenus'
import { useMenuCsvImport } from '@/composables/useMenuCsvImport'
import MenuEditor from '@/components/admin/MenuEditor.vue'
import DatePicker from '@/components/admin/DatePicker.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
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
const csvFileInputRef = ref<HTMLInputElement | null>(null)
const csvImportSuccess = ref<string | null>(null)
const showMonthDialog = ref(false)
const selectedCsvFile = ref<File | null>(null)
const selectedYear = ref<number>(new Date().getFullYear())
const selectedMonth = ref<number>(new Date().getMonth())

const {
  loading: csvLoading,
  error: csvError,
  progress: csvProgress,
  importCsv: importCsvFile,
} = useMenuCsvImport()

const selectedDateString = computed(() => {
  return selectedDate.value.toISOString().split('T')[0] || null
})

const handleDateChange = async (dateString: string) => {
  if (!dateString) return
  const date = new Date(dateString)
  selectedDate.value = date
  await fetchMenuByDate(date)
  if (currentMenu.value?.deadline) {
    deadline.value = currentMenu.value.deadline
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
    const parts = deadline.value.split(':').map(Number)
    const hours = parts[0] ?? 0
    const minutes = parts[1] ?? 0
    const localDateTime = new Date(selectedDate.value)
    localDateTime.setHours(hours, minutes, 0, 0)

    await updateExistingMenu(currentMenu.value.documentId, {
      deadline: localDateTime,
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

const handleCsvUploadClick = () => {
  csvFileInputRef.value?.click()
}

const handleCsvFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Store the file and show month selection dialog
  selectedCsvFile.value = file
  const now = new Date()
  selectedYear.value = now.getFullYear()
  selectedMonth.value = now.getMonth()
  showMonthDialog.value = true

  // Reset file input so the same file can be selected again
  if (target) {
    target.value = ''
  }
}

const confirmMonthSelection = async () => {
  if (!selectedCsvFile.value) return

  showMonthDialog.value = false
  csvImportSuccess.value = null

  try {
    const result = await importCsvFile(
      selectedCsvFile.value,
      selectedYear.value,
      selectedMonth.value,
    )
    csvImportSuccess.value = t('admin.menus.csvImportSuccess', {
      products: result.productsCreated,
      menus: result.menusCreated,
    })
    // Refresh available products and current menu
    await Promise.all([fetchAvailableProducts(), fetchMenuByDate(selectedDate.value)])
  } catch (err) {
    console.error('CSV import failed:', err)
  } finally {
    selectedCsvFile.value = null
  }
}

const cancelMonthSelection = () => {
  showMonthDialog.value = false
  selectedCsvFile.value = null
}

onMounted(async () => {
  await Promise.all([fetchAvailableProducts(), fetchMenuByDate(selectedDate.value)])
  if (currentMenu.value?.deadline) {
    deadline.value = currentMenu.value.deadline
  }
})
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <div class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-bold text-gray-900">{{ t('admin.menus.title') }}</h1>
        <div class="flex items-center gap-2">
          <input
            ref="csvFileInputRef"
            type="file"
            accept=".csv"
            class="hidden"
            @change="handleCsvFileChange"
          />
          <Button @click="handleCsvUploadClick" :disabled="csvLoading || loading" variant="outline">
            {{ t('admin.menus.uploadCsv') }}
          </Button>
        </div>
      </div>
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
      <div
        v-if="csvLoading || csvProgress"
        class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
      >
        <p v-if="csvProgress" class="text-blue-800">{{ csvProgress }}</p>
        <p v-else class="text-blue-800">{{ t('admin.menus.csvImportProcessing') }}</p>
      </div>
      <div v-if="csvError" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-red-800">{{ csvError }}</p>
      </div>
      <div v-if="csvImportSuccess" class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <p class="text-green-800">{{ csvImportSuccess }}</p>
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

    <!-- Month Selection Dialog -->
    <div
      v-if="showMonthDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="cancelMonthSelection"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 class="text-xl font-bold text-gray-900 mb-4">
          {{ t('admin.menus.selectMonth') }}
        </h2>
        <p class="text-sm text-gray-600 mb-4">
          {{ t('admin.menus.selectMonthDescription') }}
        </p>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ t('admin.menus.year') }}
            </label>
            <input
              v-model.number="selectedYear"
              type="number"
              :min="new Date().getFullYear() - 1"
              :max="new Date().getFullYear() + 1"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ t('admin.menus.month') }}
            </label>
            <select
              v-model.number="selectedMonth"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option :value="0">{{ t('admin.menus.january') }}</option>
              <option :value="1">{{ t('admin.menus.february') }}</option>
              <option :value="2">{{ t('admin.menus.march') }}</option>
              <option :value="3">{{ t('admin.menus.april') }}</option>
              <option :value="4">{{ t('admin.menus.may') }}</option>
              <option :value="5">{{ t('admin.menus.june') }}</option>
              <option :value="6">{{ t('admin.menus.july') }}</option>
              <option :value="7">{{ t('admin.menus.august') }}</option>
              <option :value="8">{{ t('admin.menus.september') }}</option>
              <option :value="9">{{ t('admin.menus.october') }}</option>
              <option :value="10">{{ t('admin.menus.november') }}</option>
              <option :value="11">{{ t('admin.menus.december') }}</option>
            </select>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <Button variant="outline" @click="cancelMonthSelection">
            {{ t('admin.cancel') }}
          </Button>
          <Button @click="confirmMonthSelection" :disabled="csvLoading">
            {{ t('admin.confirm') }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
