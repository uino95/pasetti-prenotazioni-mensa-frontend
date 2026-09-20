import { ref, computed } from 'vue'
import {
  getScheduleDays,
  createScheduleDay,
  updateScheduleDay,
  addItemToScheduleDay,
  removeItemFromScheduleDay,
  type ScheduleDay,
  type Weekday,
  WEEKDAYS,
} from '@/api/admin/schedule'
import { getProducts, type Product, type ProductFilters } from '@/api/admin/products'
import { DEFAULT_DEADLINE, getMenus, deleteMenus, type Menu } from '@/api/admin/menus'

function getWeekdayForDate(day: string): Weekday {
  return WEEKDAYS[(new Date(day).getDay() + 6) % 7]!
}

function todayDateString(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const dayOfMonth = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${dayOfMonth}`
}

export function useAdminSchedule() {
  const scheduleDays = ref<ScheduleDay[]>([])
  const availableProducts = ref<Product[]>([])
  const totalAvailableProducts = ref(0)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const futureMenus = ref<Menu[]>([])
  const checkingFutureMenus = ref(false)
  const resolvedWeekdays = ref<Set<Weekday>>(new Set())

  const scheduleMap = computed(() => {
    const map = new Map<Weekday, ScheduleDay>()
    scheduleDays.value.forEach((day) => map.set(day.weekday, day))
    return map
  })

  const allWeekdays = computed(() => {
    return WEEKDAYS.map((weekday) => ({
      weekday,
      schedule: scheduleMap.value.get(weekday) || null,
    }))
  })

  const fetchScheduleDays = async () => {
    loading.value = true
    error.value = null
    try {
      scheduleDays.value = await getScheduleDays()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch schedule'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchAvailableProducts = async (filters?: ProductFilters) => {
    try {
      const response = await getProducts(filters)
      if (!filters?.pagination?.start) {
        availableProducts.value = response.data
      } else {
        availableProducts.value = [...availableProducts.value, ...response.data]
      }
      totalAvailableProducts.value = response.meta.pagination.total
    } catch (err: unknown) {
      console.error('Failed to fetch products:', err)
    }
  }

  const addProductToDay = async (weekday: Weekday, productId: string) => {
    saving.value = true
    error.value = null
    try {
      const existing = scheduleMap.value.get(weekday)
      if (existing) {
        const updated = await addItemToScheduleDay(existing.documentId, productId)
        const idx = scheduleDays.value.findIndex((d) => d.documentId === existing.documentId)
        if (idx !== -1) scheduleDays.value[idx] = updated
      } else {
        const created = await createScheduleDay({ weekday, deadline: DEFAULT_DEADLINE, items: [productId] })
        scheduleDays.value.push(created)
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to add product'
      throw err
    } finally {
      saving.value = false
    }
  }

  const removeProductFromDay = async (weekday: Weekday, productId: string) => {
    saving.value = true
    error.value = null
    try {
      const existing = scheduleMap.value.get(weekday)
      if (existing) {
        const updated = await removeItemFromScheduleDay(existing.documentId, productId)
        const idx = scheduleDays.value.findIndex((d) => d.documentId === existing.documentId)
        if (idx !== -1) scheduleDays.value[idx] = updated
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to remove product'
      throw err
    } finally {
      saving.value = false
    }
  }

  const saveDeadline = async (weekday: Weekday, deadline: string) => {
    saving.value = true
    error.value = null
    try {
      const existing = scheduleMap.value.get(weekday)
      if (existing) {
        const updated = await updateScheduleDay(existing.documentId, { deadline })
        const idx = scheduleDays.value.findIndex((d) => d.documentId === existing.documentId)
        if (idx !== -1) scheduleDays.value[idx] = updated
      } else {
        const created = await createScheduleDay({ weekday, deadline })
        scheduleDays.value.push(created)
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to save deadline'
      throw err
    } finally {
      saving.value = false
    }
  }

  const fetchFutureMenusForWeekday = async (weekday: Weekday) => {
    checkingFutureMenus.value = true
    error.value = null
    try {
      const menus = await getMenus({ day: { from: todayDateString() } })
      futureMenus.value = menus
        .filter((menu) => getWeekdayForDate(menu.day) === weekday)
        .sort((a, b) => a.day.localeCompare(b.day))
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch future menus'
      throw err
    } finally {
      checkingFutureMenus.value = false
    }
  }

  const deleteFutureMenus = async (menuIds: string[]) => {
    if (menuIds.length === 0) return
    saving.value = true
    error.value = null
    try {
      await deleteMenus(menuIds)
      const deleted = new Set(menuIds)
      futureMenus.value = futureMenus.value.filter((menu) => !deleted.has(menu.documentId))
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to delete future menus'
      throw err
    } finally {
      saving.value = false
    }
  }

  const saveAllDeadlines = async (deadline: string) => {
    saving.value = true
    error.value = null
    try {
      const results = await Promise.all(
        WEEKDAYS.map(async (weekday) => {
          const existing = scheduleMap.value.get(weekday)
          if (existing) {
            return updateScheduleDay(existing.documentId, { deadline })
          }
          return createScheduleDay({ weekday, deadline })
        }),
      )
      scheduleDays.value = results
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to save deadlines'
      throw err
    } finally {
      saving.value = false
    }
  }

  return {
    scheduleDays,
    scheduleMap,
    allWeekdays,
    availableProducts,
    totalAvailableProducts,
    loading,
    saving,
    error,
    futureMenus,
    checkingFutureMenus,
    resolvedWeekdays,
    fetchScheduleDays,
    fetchAvailableProducts,
    addProductToDay,
    removeProductFromDay,
    saveDeadline,
    saveAllDeadlines,
    fetchFutureMenusForWeekday,
    deleteFutureMenus,
  }
}
