<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { User } from '@/api/admin/users'
import { getGuests, createGuest } from '@/api/guests'
import { useDebounceFn } from '@vueuse/core'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-vue-next'

interface Props {
  show: boolean
  /** Guest documentIds that already have an order today (exclude from select list) */
  guestIdsWithOrderToday?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  guestIdsWithOrderToday: () => [],
})

const emit = defineEmits<{
  close: []
  select: [guestId: string]
}>()

const { t } = useI18n()

const mode = ref<'select' | 'create'>('select')
const searchQuery = ref('')
const guestName = ref('')
const creating = ref(false)
const error = ref<string | null>(null)

const guests = ref<User[]>([])
const loading = ref(false)

const idsWithOrderToday = computed(() => new Set(props.guestIdsWithOrderToday ?? []))

const guestsWithoutOrderToday = computed(() => {
  return guests.value.filter((g) => !idsWithOrderToday.value.has(g.documentId))
})

const doSearch = useDebounceFn(async (q: string) => {
  return await getGuests(q)
}, 400)

const searchGuests = async () => {
  const q = searchQuery.value.trim()
  if (!q) {
    guests.value = []
    return
  }
  loading.value = true
  try {
    guests.value = await doSearch(q)
  } finally {
    loading.value = false
  }
}

watch(searchQuery, () => {
  if (props.show && mode.value === 'select') {
    searchGuests()
  }
})

watch(
  () => props.show,
  (show) => {
    if (show) {
      searchQuery.value = ''
      guestName.value = ''
      error.value = null
      mode.value = 'select'
      guests.value = []
    }
  },
  { immediate: true },
)

const handleSelectGuest = (guest: User) => {
  emit('select', guest.documentId)
}

const handleCreate = async () => {
  const name = guestName.value.trim()
  if (!name) return
  creating.value = true
  error.value = null
  try {
    const newGuest = await createGuest({ name })
    emit('select', newGuest.documentId)
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('guests.modalError')
  } finally {
    creating.value = false
  }
}

const handleClose = () => {
  mode.value = 'select'
  guestName.value = ''
  searchQuery.value = ''
  error.value = null
  emit('close')
}

const switchToCreate = () => {
  mode.value = 'create'
  error.value = null
}

const switchToSelect = () => {
  mode.value = 'select'
  error.value = null
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="handleClose"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ t('guests.modalTitle') }}
            </h3>
            <Button v-if="mode === 'select'" variant="outline" size="sm" @click="switchToCreate">
              {{ t('guests.modalCreateNew') }}
            </Button>
            <Button v-else variant="outline" size="sm" @click="switchToSelect">
              <ArrowLeft />
              {{ t('guests.back') }}
            </Button>
          </div>

          <div v-if="mode === 'select'" class="space-y-2">
            <input
              v-model="searchQuery"
              type="search"
              :placeholder="t('admin.search')"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <p v-if="loading && guests.length === 0" class="text-gray-500 text-sm">
              {{ t('admin.loading') }}
            </p>
            <p
              v-else-if="searchQuery.trim() && !loading && guestsWithoutOrderToday.length === 0"
              class="text-gray-600 text-sm"
            >
              {{ t('guests.noGuestsToSelect') }}
            </p>
            <p v-else-if="!searchQuery.trim() && guests.length === 0" class="text-gray-500 text-sm">
              {{ t('guests.searchHint') }}
            </p>
            <ul v-else class="space-y-1 max-h-48 overflow-y-auto">
              <li
                v-for="guest in guestsWithoutOrderToday"
                :key="guest.documentId"
                class="flex items-center justify-between p-2 rounded hover:bg-gray-100"
              >
                <span class="text-gray-900">{{ guest.username }}</span>
                <Button variant="ghost" size="sm" @click="handleSelectGuest(guest)">
                  {{ t('guests.select') }}
                </Button>
              </li>
              <li v-if="loading && guests.length > 0" class="p-2 text-sm text-gray-500">
                {{ t('admin.loading') }}
              </li>
            </ul>
          </div>

          <form v-else class="space-y-4" @submit.prevent="handleCreate">
            <div>
              <label for="guest-name" class="block text-sm font-medium text-gray-700 mb-1">
                {{ t('guests.guestName') }} *
              </label>
              <input
                id="guest-name"
                v-model="guestName"
                type="text"
                required
                :placeholder="t('guests.guestNamePlaceholder')"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
            <div class="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" @click="handleClose">
                {{ t('admin.cancel') }}
              </Button>
              <Button type="submit" :disabled="creating || !guestName.trim()">
                {{ creating ? t('admin.loading') : t('admin.create') }}
              </Button>
            </div>
          </form>

          <div v-if="mode === 'select'" class="flex justify-end pt-4">
            <Button variant="secondary" @click="handleClose">
              {{ t('admin.cancel') }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped></style>
