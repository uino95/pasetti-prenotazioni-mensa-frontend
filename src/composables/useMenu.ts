import { ref, computed } from 'vue'
import { getMenuOfDay, type MenuItem } from '@/api/menu'
import { isDeadlinePassed, timeUntilDeadline } from '@/utils/date'
import { AxiosError } from 'axios'

export function useMenu() {
  const items = ref<MenuItem[]>([])
  const deadline = ref<string>('')
  const loading = ref(false)
  const error = ref<string | null>(null)

  const canOrder = computed(() => {
    if (!deadline.value) return false
    return !isDeadlinePassed(deadline.value)
  })

  const timeRemaining = computed(() => {
    if (!deadline.value) return ''
    return timeUntilDeadline(deadline.value)
  })

  const fetchMenu = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await getMenuOfDay()
      items.value = response.items
      deadline.value = response.deadline
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.status === 404) {
        error.value = 'No menu found for today'
      } else {
        error.value = err instanceof Error ? err.message : 'Failed to load menu'
      }
    } finally {
      loading.value = false
    }
  }

  return {
    items,
    deadline,
    canOrder,
    loading,
    error,
    timeRemaining,
    fetchMenu,
  }
}
