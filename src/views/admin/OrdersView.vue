<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import DatePicker from '@/components/admin/DatePicker.vue'
import { useAdminOrders } from '@/composables/useAdminOrders'
import OrderSummary from '@/components/admin/OrderSummary.vue'
import OrderList from '@/components/admin/OrderList.vue'
import OrderEditDialog from '@/components/admin/OrderEditDialog.vue'
import { toRelativeDate, toLocalDateString, parseLocalDate } from '@/utils/date'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import { isAdmin } from '@/utils/role'
import { getMenuByDate } from '@/api/admin/menus'
import type { MenuItem } from '@/api/admin/menus'
import type { Order, OrderItemFullyPopulated } from '@/api/orders'

const { t } = useI18n()
const { loading, currentOrders, error, fetchOrdersByDate, doDeleteOrder, doUpdateOrder } =
  useAdminOrders()

const showDeleteDialog = ref(false)
const selectedDate = ref<Date>(new Date())
const orderToDelete = ref<string | undefined>(undefined)
const orderToEdit = ref<Order<OrderItemFullyPopulated> | null>(null)
const menuItems = ref<MenuItem[]>([])
const savingOrder = ref(false)

const selectDateString = computed(() => {
  const relativeDate = toRelativeDate(selectedDate.value)
  const translationString = `utils.dates.${relativeDate}`
  const translation = t(translationString)
  return translation === translationString ? relativeDate : translation
})

const selectedDateString = computed(() => {
  return toLocalDateString(selectedDate.value)
})

const handleDateChange = async (dateString: string) => {
  if (!dateString) return
  const date = parseLocalDate(dateString)
  selectedDate.value = date
  await fetchOrdersByDate(selectedDate.value)
}

const issueRemove = (documentId: string) => {
  orderToDelete.value = documentId
  showDeleteDialog.value = true
}

const issueEdit = async (documentId: string) => {
  const order = currentOrders.value.find((o) => o.documentId === documentId)
  if (!order) return
  try {
    const menu = await getMenuByDate(selectedDate.value)
    menuItems.value = menu?.items ?? []
  } catch {
    menuItems.value = []
  }
  orderToEdit.value = order
}

const handleSaveOrder = async (payload: { itemIds: string[]; note: string }) => {
  const order = orderToEdit.value
  if (!order) return
  savingOrder.value = true
  try {
    await doUpdateOrder(order.documentId, payload.itemIds, payload.note)
    order.items = menuItems.value
      .filter((item) => payload.itemIds.includes(item.documentId))
      .map((item) => ({ documentId: item.documentId, name: item.name, category: item.category }))
    order.note = payload.note || null
    orderToEdit.value = null
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to update order'
  } finally {
    savingOrder.value = false
  }
}

const confirmDelete = async () => {
  if (!orderToDelete.value || !isAdmin()) return
  await doDeleteOrder(orderToDelete.value)
  const indexToDelete = currentOrders.value.findIndex(
    (ord) => ord.documentId === orderToDelete.value,
  )
  if (indexToDelete >= 0) {
    currentOrders.value.splice(indexToDelete, 1)
  }
  showDeleteDialog.value = false
  orderToDelete.value = undefined
}

onMounted(async () => {
  await fetchOrdersByDate(selectedDate.value)
})
</script>

<template>
  <div class="flex flex-col gap-6 max-w-7xl mx-auto">
    <h1 class="text-2xl font-bold text-gray-900">{{ t('admin.orders.title') }}</h1>
    <div class="flex items-center gap-4">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 w-full">
        <DatePicker
          :model-value="selectedDateString"
          :label="t('admin.menus.selectDate')"
          @update:model-value="handleDateChange"
        />
      </div>
    </div>

    <div v-if="error" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-800">{{ error }}</p>
    </div>
    <div v-if="currentOrders.length === 0 && !loading" class="text-center py-8">
      <p class="text-gray-600 mb-4">
        {{ t('admin.orders.no_orders_yet', { date: selectDateString }) }}
      </p>
    </div>
    <OrderSummary :orders="currentOrders" />
    <OrderList
      :selected-date="selectedDate"
      :orders="currentOrders"
      @remove-order="issueRemove"
      @update-order="issueEdit"
    />
  </div>

  <ConfirmDialog
    :show="showDeleteDialog"
    :title="t('admin.menus.deleteMenu')"
    :message="t('admin.menus.deleteConfirm')"
    @confirm="confirmDelete"
    @cancel="() => (showDeleteDialog = false)"
  />

  <OrderEditDialog
    :show="!!orderToEdit"
    :order="orderToEdit"
    :menu-items="menuItems"
    :saving="savingOrder"
    @cancel="() => (orderToEdit = null)"
    @save="handleSaveOrder"
  />
</template>

<style scoped></style>
