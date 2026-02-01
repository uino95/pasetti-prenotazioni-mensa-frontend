<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAdminUsers } from '@/composables/useAdminUsers'
import UserForm from '@/components/admin/UserForm.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import {
  type User,
  type CreateUserRequest,
  type UpdateUserRequest,
  getUsers,
} from '@/api/admin/users'
import { useDebounceFn } from '@vueuse/core'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { Button } from '@/components/ui/button'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import MonthSelectorDialog from '@/components/admin/MonthSelectorDialog.vue'

const { t } = useI18n()
const { users, loading, error, fetchUsers, createNewUser, updateExistingUser, removeUser } =
  useAdminUsers()

const showUserForm = ref(false)
const editingUser = ref<User | null>(null)
const showDeleteDialog = ref(false)
const userToDelete = ref<User | null>(null)
const selectedMonth = ref(new Date().getMonth())
const selectedYear = ref(new Date().getFullYear())
const searchQuery = ref('')

type UserFilterType = 'users' | 'guests' | 'both'
const userFilterType = ref<UserFilterType>('users')

function getIsGuestFilter(): boolean | undefined {
  if (userFilterType.value === 'guests') return true
  if (userFilterType.value === 'users') return false
  return undefined
}
const csvFileInput = ref<HTMLInputElement | null>(null)
const isUploadingCsv = ref(false)
const uploadStatus = ref<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
const showExportDialog = ref(false)
const isExporting = ref(false)

const handleCreateUser = () => {
  editingUser.value = null
  showUserForm.value = true
}

const handleEditUser = (user: User) => {
  editingUser.value = user
  showUserForm.value = true
}

const handleDeleteUser = (user: User) => {
  userToDelete.value = user
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (userToDelete.value) {
    await removeUser(userToDelete.value.id)
    showDeleteDialog.value = false
    userToDelete.value = null
  }
}

const handleFormSubmit = async (data: CreateUserRequest | UpdateUserRequest) => {
  try {
    if (editingUser.value) {
      await updateExistingUser(editingUser.value.id, data as UpdateUserRequest)
    } else {
      await createNewUser(data as CreateUserRequest)
    }
    showUserForm.value = false
    editingUser.value = null
  } catch (err) {
    console.error('Failed to save user:', err)
  }
}

const handleFormCancel = () => {
  showUserForm.value = false
  editingUser.value = null
}

const searchUsers = useDebounceFn(async () => {
  await fetchUsers({
    month: selectedMonth.value,
    year: selectedYear.value,
    search: searchQuery.value,
    isGuest: getIsGuestFilter(),
  })
}, 500)

async function onFilterTypeChange() {
  await fetchUsers({
    month: selectedMonth.value,
    year: selectedYear.value,
    search: searchQuery.value,
    isGuest: getIsGuestFilter(),
  })
}

const handleCsvUpload = () => {
  csvFileInput.value?.click()
}

const processCsvFile = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // Reset status
  uploadStatus.value = null
  isUploadingCsv.value = true

  try {
    // Parse CSV using PapaParse with headers
    const parseResult = await new Promise<Papa.ParseResult<Record<string, string>>>(
      (resolve, reject) => {
        Papa.parse<Record<string, string>>(file, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim().toLowerCase(),
          complete: (results) => resolve(results as Papa.ParseResult<Record<string, string>>),
          error: (error) => reject(error),
        })
      },
    )

    const rows = parseResult.data

    if (rows.length === 0) {
      uploadStatus.value = {
        type: 'error',
        message: t('admin.users.uploadCsvInvalidFormat'),
      }
      isUploadingCsv.value = false
      return
    }

    // Validate required headers
    const requiredHeaders = ['username']
    const firstRow = rows[0]
    if (!firstRow) {
      uploadStatus.value = {
        type: 'error',
        message: t('admin.users.uploadCsvInvalidFormat'),
      }
      isUploadingCsv.value = false
      return
    }

    const missingHeaders = requiredHeaders.filter((header) => !(header in firstRow))

    if (missingHeaders.length > 0) {
      uploadStatus.value = {
        type: 'error',
        message: t('admin.users.uploadCsvMissingHeaders', {
          headers: missingHeaders.join(', '),
        }),
      }
      isUploadingCsv.value = false
      return
    }

    // Process each row
    let successCount = 0
    let failCount = 0
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (!row) {
        failCount++
        errors.push(`Row ${i + 2}: Empty row`)
        continue
      }

      const username = String(row.username || '')
        .trim()
        .toLowerCase()
      const email = String(row.email || username.split(' ').join('.') + '@francopasetti.it')
        .trim()
        .toLowerCase()
      const password = String(row.password || username.split(' ').join('.')).trim()

      if (!username || !email || !password) {
        failCount++
        errors.push(`Row ${i + 2}: Missing required fields`)
        continue
      }

      try {
        await createNewUser({ username, email, password })
        successCount++
      } catch (err) {
        failCount++
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        errors.push(`Row ${i + 2}: ${errorMessage}`)
      }
    }

    // Refresh users list
    await fetchUsers({
      month: selectedMonth.value,
      year: selectedYear.value,
      isGuest: getIsGuestFilter(),
    })

    // Show status
    if (failCount === 0) {
      uploadStatus.value = {
        type: 'success',
        message: t('admin.users.uploadCsvSuccess', { count: successCount }),
      }
    } else if (successCount > 0) {
      uploadStatus.value = {
        type: 'info',
        message: t('admin.users.uploadCsvPartialSuccess', {
          success: successCount,
          total: rows.length,
          failed: failCount,
        }),
      }
    } else {
      uploadStatus.value = {
        type: 'error',
        message: t('admin.users.uploadCsvError', {
          error: errors.slice(0, 3).join('; '),
        }),
      }
    }

    // Clear file input
    if (target) {
      target.value = ''
    }
  } catch (err) {
    uploadStatus.value = {
      type: 'error',
      message: t('admin.users.uploadCsvError', {
        error: err instanceof Error ? err.message : 'Unknown error',
      }),
    }
  } finally {
    isUploadingCsv.value = false
  }
}

const handleExportClick = () => {
  showExportDialog.value = true
}

const cancelExport = () => {
  showExportDialog.value = false
}

const confirmExport = async (data: { year: number; month: number }) => {
  if (isExporting.value) return

  showExportDialog.value = false
  isExporting.value = true

  try {
    const usersWithOrders = await getUsers({
      month: data.month,
      year: data.year,
    })

    // Sort by type (users first, then guests), then by username
    const sorted = [...usersWithOrders].sort((a, b) => {
      const aIsGuest = a.isGuest === true ? 1 : 0
      const bIsGuest = b.isGuest === true ? 1 : 0
      if (aIsGuest !== bIsGuest) return aIsGuest - bIsGuest
      return a.username.localeCompare(b.username)
    })

    // Convert to Excel format: users first, separator row, then guests
    const worksheetData: Array<Record<string, unknown>> = []
    const totalOrders = usersWithOrders.reduce((acc, user) => acc + (user.orders?.count || 0), 0)

    const usersOnly = sorted.filter((u) => u.isGuest !== true && u.orders?.count > 0)
    const guestsOnly = sorted.filter((u) => u.isGuest === true && u.orders?.count > 0)

    for (const userData of usersOnly) {
      worksheetData.push({
        Username: userData.username,
        Ordini: userData.orders?.count || 0,
      })
    }
    // Separator row between users and guests
    if (guestsOnly.length > 0) {
      worksheetData.push({ Username: '', Ordini: '' })
      worksheetData.push({ Username: '--- Ospiti ---', Ordini: '' })
      worksheetData.push({ Username: '', Ordini: '' })
      for (const userData of guestsOnly) {
        worksheetData.push({
          Username: userData.username,
          Ordini: userData.orders?.count || 0,
        })
      }
    }

    // Add empty row
    worksheetData.push({
      Username: '',
      Ordini: '',
    })

    worksheetData.push({
      Username: 'Totale',
      Ordini: totalOrders,
    })

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(worksheetData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ordini')

    // Generate filename
    const monthNames = [
      'Gennaio',
      'Febbraio',
      'Marzo',
      'Aprile',
      'Maggio',
      'Giugno',
      'Luglio',
      'Agosto',
      'Settembre',
      'Ottobre',
      'Novembre',
      'Dicembre',
    ]
    const monthName = monthNames[data.month]
    const filename = `Ordini_${monthName}_${data.year}.xlsx`

    // Download file
    XLSX.writeFile(workbook, filename)

    uploadStatus.value = {
      type: 'success',
      message: t('admin.users.exportSuccess', {
        filename,
        count: totalOrders,
      }),
    }
  } catch (err) {
    uploadStatus.value = {
      type: 'error',
      message: t('admin.users.exportError', {
        error: err instanceof Error ? err.message : 'Unknown error',
      }),
    }
  } finally {
    isExporting.value = false
  }
}

onMounted(async () => {
  await fetchUsers({
    month: selectedMonth.value,
    year: selectedYear.value,
    isGuest: getIsGuestFilter(),
  })
})
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <div class="mb-6 flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('admin.users.title') }}</h1>
      <div class="flex gap-3">
        <Button @click="handleCsvUpload" variant="secondary" :disabled="isUploadingCsv">
          {{ isUploadingCsv ? t('admin.users.uploadCsvProcessing') : t('admin.users.uploadCsv') }}
        </Button>
        <input
          ref="csvFileInput"
          type="file"
          accept=".csv"
          class="hidden"
          @change="processCsvFile"
        />
        <Button @click="handleCreateUser">
          {{ t('admin.users.createUser') }}
        </Button>
      </div>
    </div>

    <div v-if="error" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-800">{{ error }}</p>
    </div>

    <div
      v-if="uploadStatus"
      :class="{
        'bg-green-50 border-green-200 text-green-800': uploadStatus.type === 'success',
        'bg-red-50 border-red-200 text-red-800': uploadStatus.type === 'error',
        'bg-blue-50 border-blue-200 text-blue-800': uploadStatus.type === 'info',
      }"
      class="mb-4 p-4 border rounded-lg"
    >
      <p>{{ uploadStatus.message }}</p>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
      <div class="flex-1">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          {{ t('admin.search') }}
        </label>
        <input
          v-model="searchQuery"
          @input="searchUsers"
          type="text"
          :placeholder="t('admin.users.searchPlaceholder')"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div class="flex gap-4 items-end mt-4 justify-between">
        <div class="flex gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ t('admin.users.month') }}
            </label>
            <select
              v-model="selectedMonth"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option v-for="month in 12" :key="month" :value="month - 1">{{ month }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ t('admin.users.year') }}
            </label>
            <input
              v-model.number="selectedYear"
              type="number"
              min="2020"
              :max="new Date().getFullYear() + 1"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-32"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ t('admin.users.filterType') }}
            </label>
            <select
              v-model="userFilterType"
              @change="onFilterTypeChange"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="users">{{ t('admin.users.filterShowUsers') }}</option>
              <option value="guests">{{ t('admin.users.filterShowGuests') }}</option>
              <option value="both">{{ t('admin.users.filterShowBoth') }}</option>
            </select>
          </div>
        </div>
        <div class="flex gap-4">
          <Button
            @click="
              fetchUsers({ month: selectedMonth, year: selectedYear, isGuest: getIsGuestFilter() })
            "
            variant="secondary"
          >
            {{ t('admin.users.refreshCounts') }}
          </Button>
          <Button @click="handleExportClick" variant="secondary" :disabled="isExporting">
            {{ isExporting ? t('admin.users.exporting') : t('admin.users.exportOrders') }}
          </Button>
        </div>
      </div>
    </div>

    <div v-if="users.length === 0 && !loading" class="text-center py-8">
      <p class="text-gray-600">{{ t('admin.users.noUsers') }}</p>
    </div>

    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {{ t('admin.users.username') }}
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {{ t('admin.users.ordersCount') }}
            </th>
            <th
              class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {{ t('admin.actions') }}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <template v-if="loading">
            <tr v-for="i in 5" :key="i" class="hover:bg-gray-50">
              <td v-for="j in 3" :key="j" class="px-6 py-2">
                <SkeletonLoader height="20px" width="150px" />
              </td>
              <td class="px-6 py-4 flex justify-end">
                <SkeletonLoader height="20px" width="150px" />
              </td>
            </tr>
          </template>
          <template v-else>
            <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ user.username }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {{ user.orders?.count || 0 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Button @click="handleEditUser(user)" variant="ghost" size="sm" class="mr-4">
                  {{ t('admin.edit') }}
                </Button>
                <Button @click="handleDeleteUser(user)" variant="ghost" size="sm">
                  {{ t('admin.delete') }}
                </Button>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <UserForm
      v-if="showUserForm"
      :user="editingUser"
      @submit="handleFormSubmit"
      @cancel="handleFormCancel"
    />

    <ConfirmDialog
      :show="showDeleteDialog"
      :title="t('admin.users.deleteUser')"
      :message="
        t('admin.users.deleteConfirm', {
          username: userToDelete?.username || '',
        })
      "
      @confirm="confirmDelete"
      @cancel="
        () => {
          showDeleteDialog = false
          userToDelete = null
        }
      "
    />

    <MonthSelectorDialog
      :show="showExportDialog"
      :is-loading="isExporting"
      :description="t('admin.users.selectExportMonthDescription')"
      @confirm="confirmExport"
      @cancel="cancelExport"
    />
  </div>
</template>

<style scoped></style>
