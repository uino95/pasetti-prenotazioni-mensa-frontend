import { ref, computed } from 'vue'
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
