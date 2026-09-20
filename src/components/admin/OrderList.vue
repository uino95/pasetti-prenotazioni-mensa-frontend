<script setup lang="ts">
import { type Order, type OrderItemFullyPopulated } from '@/api/orders'
import { useI18n } from 'vue-i18n'
import Button from '../ui/button/Button.vue'
import { PencilIcon, Trash2 } from 'lucide-vue-next'
import { isAdmin } from '@/utils/role'
import { isSameLocalDay } from '@/utils/date'
import { computed } from 'vue'

interface Props {
  orders: Order<OrderItemFullyPopulated>[]
  selectedDate: Date
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  'remove-order': [documentId: string]
  'update-order': [documentId: string]
}>()

const { t } = useI18n()

const isTodayOrder = () => {
  return isSameLocalDay(props.selectedDate, new Date())
}

const isEditable = computed(() => isAdmin() && isTodayOrder())

const userName = (order: Order<OrderItemFullyPopulated>) =>
  order.user?.username || order.user?.email || '—'

const itemNames = (order: Order<OrderItemFullyPopulated>) =>
  order.items?.map((item) => item.name).join(', ') || '—'
</script>
<template>
  <div
    v-if="!loading && orders.length"
    class="flex flex-col gap-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4 w-full"
  >
    <h1 class="text-2xl font-semibold">{{ t('admin.orders.list_title') }}</h1>
    <div class="overflow-x-auto">
      <table class="w-full text-left border-separate border-spacing-y-4">
        <thead>
          <tr class="text-gray-500">
            <th class="text-sm font-semibold pr-4">{{ t('admin.orders.user') }}</th>
            <th class="text-sm font-semibold pr-4">{{ t('admin.orders.plates') }}</th>
            <th class="text-sm font-semibold">{{ t('admin.orders.note') }}</th>
            <th v-if="isEditable" class="text-sm font-semibold"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.documentId">
            <td class="font-semibold whitespace-nowrap pr-4">
              {{ userName(order) }}
            </td>
            <td class="pr-4">
              {{ itemNames(order) }}
            </td>
            <td class="text-gray-600 whitespace-pre-wrap">
              {{ order.note }}
            </td>
            <td v-if="isEditable" class="flex justify-end">
              <Button
                @click="emit('remove-order', order.documentId)"
                :disabled="loading"
                variant="ghost"
                size="sm"
              >
                <Trash2 class="w-4 h-4" />
              </Button>
              <Button
                @click="emit('update-order', order.documentId)"
                :disabled="loading"
                variant="ghost"
                size="sm"
              >
                <PencilIcon class="w-4 h-4" />
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
