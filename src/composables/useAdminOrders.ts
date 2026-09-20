import { ref } from 'vue'
import {
  type Order,
  type OrderItemFullyPopulated,
  getAllOrdersByDate,
  deleteOrder,
  updateOrder,
} from '@/api/orders'

export function useAdminOrders() {
  const currentOrders = ref<Order<OrderItemFullyPopulated>[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchOrdersByDate = async (date: Date) => {
    loading.value = true
    error.value = null
    try {
      currentOrders.value = await getAllOrdersByDate(date)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch orders'
    } finally {
      loading.value = false
    }
  }

  const doDeleteOrder = async (orderId: string) => {
    loading.value = true;
    error.value = null;
    try {
      await deleteOrder(orderId)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to delete order'
    } finally {
      loading.value = false
    }
  }

  const doUpdateOrder = async (orderId: string, itemIds: string[], note?: string) => {
    loading.value = true
    error.value = null
    try {
      await updateOrder(orderId, { items: itemIds, note: note })
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to update order'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    currentOrders,
    loading,
    error,
    fetchOrdersByDate,
    doDeleteOrder,
    doUpdateOrder,
  }
}
