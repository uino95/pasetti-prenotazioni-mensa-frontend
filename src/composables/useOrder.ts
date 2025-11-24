import { ref, computed } from 'vue'
import {
  getCurrentOrder,
  placeOrder as apiPlaceOrder,
  updateOrder as apiUpdateOrder,
  type Order,
  type PlaceOrderRequest,
  type UpdateOrderRequest,
} from '@/api/orders'
import { useAuthStore } from '@/stores/auth'
import { AxiosError } from 'axios'

export function useOrder(canOrderFromMenu: () => boolean) {
  const authStore = useAuthStore()
  const currentOrder = ref<Order | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const canEdit = computed(() => {
    return canOrderFromMenu()
  })

  const fetchCurrentOrder = async () => {
    if (!authStore.user?.documentId) {
      return
    }
    loading.value = true
    error.value = null
    try {
      currentOrder.value = await getCurrentOrder(authStore.user.documentId)
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.status === 404) {
        currentOrder.value = null
      } else {
        error.value = err instanceof Error ? err.message : 'Failed to load order'
      }
    } finally {
      loading.value = false
    }
  }

  const placeOrder = async (itemIds: string[], note?: string) => {
    if (!authStore.user?.documentId) {
      return
    }
    loading.value = true
    error.value = null
    try {
      const request: PlaceOrderRequest = {
        userId: authStore.user.documentId,
        items: itemIds,
        note: note || undefined,
      }
      const order = await apiPlaceOrder(request)
      currentOrder.value = order
      return order
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.status === 400) {
        error.value = err.response?.data?.error?.message || 'Failed to place order'
      } else {
        error.value = err instanceof Error ? err.message : 'Failed to place order'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateOrder = async (orderId: string, itemIds: string[], note?: string) => {
    loading.value = true
    error.value = null
    try {
      const request: UpdateOrderRequest = {
        items: itemIds,
        note: note || undefined,
      }
      const order = await apiUpdateOrder(orderId, request)
      currentOrder.value = order
      return order
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.status === 400) {
        error.value = err.response?.data?.error?.message || 'Failed to update order'
      } else {
        error.value = err instanceof Error ? err.message : 'Failed to update order'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    currentOrder,
    loading,
    error,
    canEdit,
    fetchCurrentOrder,
    placeOrder,
    updateOrder,
  }
}
