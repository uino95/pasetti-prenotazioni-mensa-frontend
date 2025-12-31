import { ref, onUnmounted, getCurrentInstance, watch } from 'vue'
import { getMenuOfDay, type MenuItem } from '@/api/admin/menus'
import { isDeadlinePassed, timeUntilDeadline } from '@/utils/date'
import { AxiosError } from 'axios'
import type { Menu } from '@/api/admin/menus'

export function useMenu() {
  const menu = ref<Menu | null>(null)
  const items = ref<MenuItem[]>([])
  const deadline = ref<string>('')
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Refs that will be updated by the interval
  const canOrder = ref(false)
  const timeRemaining = ref('')

  // Function to update canOrder and timeRemaining based on current time
  const updateDeadlineValues = () => {
    if (!deadline.value) {
      canOrder.value = false
      timeRemaining.value = ''
      return
    }

    const currentTime = new Date()
    canOrder.value = !isDeadlinePassed(deadline.value, currentTime)
    timeRemaining.value = timeUntilDeadline(deadline.value, currentTime)
  }

  // Set up interval to update values every second
  let intervalId: ReturnType<typeof setInterval> | null = null

  const instance = getCurrentInstance()
  if (instance) {
    intervalId = setInterval(() => {
      updateDeadlineValues()
    }, 1000)

    onUnmounted(() => {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    })
  } else {
    // Fallback for non-component usage
    intervalId = setInterval(() => {
      updateDeadlineValues()
    }, 1000)
  }

  // Watch deadline changes and update immediately
  watch(
    deadline,
    () => {
      updateDeadlineValues()
    },
    { immediate: true },
  )

  const fetchMenu = async () => {
    loading.value = true
    error.value = null
    try {
      menu.value = await getMenuOfDay()
      items.value = menu.value.items
      deadline.value = menu.value.deadline
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
    menu,
    items,
    deadline,
    canOrder,
    loading,
    error,
    timeRemaining,
    fetchMenu,
  }
}
