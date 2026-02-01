<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getAllGuestsWhoOrderedToday } from '@/api/guests'
import type { UserWithOrderCount } from '@/api/admin/users'
import AddGuestModal from '@/components/AddGuestModal.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { Button } from '@/components/ui/button'

const { t } = useI18n()
const router = useRouter()

const guests = ref<UserWithOrderCount[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const showAddModal = ref(false)

const guestsWithOrdersToday = computed(() => {
  return guests.value.filter((g) => g.orders.count > 0)
})

const guestIdsWithOrderToday = computed(() =>
  guests.value.filter((g) => g.orders.count > 0).map((g) => g.documentId),
)

const goToGuestOrder = (guestId: string) => {
  router.push({ name: 'guest-order', params: { guestId } })
}

const openAddGuest = () => {
  showAddModal.value = true
}

const handleGuestSelected = (guestId: string) => {
  showAddModal.value = false
  router.push({ name: 'guest-menu', params: { guestId } })
}

const handleModalClose = () => {
  showAddModal.value = false
}

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    guests.value = await getAllGuestsWhoOrderedToday()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load guests'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="max-w-4xl mx-auto px-4 py-6">
    <h2 class="text-2xl font-bold text-gray-900 mb-4">
      {{ t('guests.pageTitle') }}
    </h2>

    <div v-if="error" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-800">{{ error }}</p>
    </div>

    <div v-if="loading" class="space-y-2">
      <SkeletonLoader v-for="i in 5" :key="i" height="48px" />
    </div>

    <div v-else class="space-y-4">
      <div v-if="guestsWithOrdersToday.length === 0" class="text-gray-600 py-4">
        {{ t('guests.emptyState') }}
      </div>
      <ul v-else class="space-y-2">
        <li
          v-for="guest in guestsWithOrdersToday"
          :key="guest.documentId"
          class="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
        >
          <span class="font-medium text-gray-900">{{ guest.username }}</span>
          <Button variant="secondary" size="sm" @click="goToGuestOrder(guest.documentId)">
            {{ t('guests.editOrder') }}
          </Button>
        </li>
      </ul>

      <div class="pt-4">
        <Button @click="openAddGuest">
          {{ t('guests.addNewGuest') }}
        </Button>
      </div>
    </div>

    <AddGuestModal
      :show="showAddModal"
      :guest-ids-with-order-today="guestIdsWithOrderToday"
      @close="handleModalClose"
      @select="handleGuestSelected"
    />
  </main>
</template>

<style scoped></style>
