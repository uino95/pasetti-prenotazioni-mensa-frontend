<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAdminSchedule } from '@/composables/useAdminSchedule'
import { useDebounceFn } from '@vueuse/core'
import { Button } from '@/components/ui/button'
import { Trash2, ChevronDown, ChevronRight } from 'lucide-vue-next'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import type { Weekday } from '@/api/admin/schedule'
import { DEFAULT_DEADLINE, type MenuItem } from '@/api/admin/menus'

const { t } = useI18n()
const {
  scheduleDays,
  allWeekdays,
  scheduleMap,
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
  saveAllDeadlines,
  fetchFutureMenusForWeekday,
  deleteFutureMenus,
} = useAdminSchedule()

const expandedDay = ref<Weekday | null>(null)
const searchQuery = ref('')
const uniqueDeadline = ref(DEFAULT_DEADLINE.slice(0, 5))

const pendingChange = ref<(() => Promise<void>) | null>(null)
const showFutureMenusPrompt = ref(false)
const selectedMenuIds = ref<Set<string>>(new Set())
const visibleFutureMenusCount = ref(10)

const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: t('admin.schedule.monday'),
  tuesday: t('admin.schedule.tuesday'),
  wednesday: t('admin.schedule.wednesday'),
  thursday: t('admin.schedule.thursday'),
  friday: t('admin.schedule.friday'),
  saturday: t('admin.schedule.saturday'),
  sunday: t('admin.schedule.sunday'),
}

const getItems = (weekday: Weekday): MenuItem[] => {
  return scheduleMap.value.get(weekday)?.items || []
}

const itemsByCategory = (weekday: Weekday) => {
  const grouped = new Map<string, MenuItem[]>()
  getItems(weekday).forEach((item) => {
    const categoryName = item.category?.name || 'Altro'
    if (!grouped.has(categoryName)) {
      grouped.set(categoryName, [])
    }
    grouped.get(categoryName)!.push(item)
  })
  return Array.from(grouped.entries()).map(([category, items]) => ({
    category,
    items,
  }))
}

const expandedItemsByCategory = computed(() => {
  if (!expandedDay.value) return []
  return itemsByCategory(expandedDay.value)
})

const getProductIdsForDay = (weekday: Weekday): Set<string> => {
  return new Set(getItems(weekday).map((item) => item.documentId))
}

const availableProductsToAdd = computed(() => {
  if (!expandedDay.value) return []
  const existingIds = getProductIdsForDay(expandedDay.value)
  return availableProducts.value.filter((p) => !existingIds.has(p.documentId))
})

const toggleDay = (weekday: Weekday) => {
  const opening = expandedDay.value !== weekday
  expandedDay.value = expandedDay.value === weekday ? null : weekday
  if (expandedDay.value) {
    if (opening) {
      resolvedWeekdays.value.delete(weekday)
      showFutureMenusPrompt.value = false
      pendingChange.value = null
    }
    searchQuery.value = ''
    fetchAvailableProducts()
    requestAnimationFrame(() => {
      const element = document.getElementById(`expanded-day-${weekday}`)
      element?.scrollIntoView({ behavior: 'smooth' })
    })
  }
}

const guardChange = async (weekday: Weekday, action: () => Promise<void>) => {
  if (resolvedWeekdays.value.has(weekday)) {
    await action()
    return
  }
  await fetchFutureMenusForWeekday(weekday)
  if (futureMenus.value.length === 0) {
    resolvedWeekdays.value.add(weekday)
    await action()
    return
  }
  pendingChange.value = action
  selectedMenuIds.value = new Set()
  visibleFutureMenusCount.value = 10
  showFutureMenusPrompt.value = true
}

const handleAddProduct = async (weekday: Weekday, productId: string) => {
  await guardChange(weekday, () => addProductToDay(weekday, productId))
}

const handleRemoveProduct = async (weekday: Weekday, productId: string) => {
  await guardChange(weekday, () => removeProductFromDay(weekday, productId))
}

const handleDeadlineChange = () => {
  if (!expandedDay.value) {
    updateAllDeadlines()
    return
  }
  guardChange(expandedDay.value, () => updateAllDeadlines())
}

const toggleMenuSelection = (menuId: string) => {
  const next = new Set(selectedMenuIds.value)
  if (next.has(menuId)) {
    next.delete(menuId)
  } else {
    next.add(menuId)
  }
  selectedMenuIds.value = next
}

const visibleFutureMenus = computed(() =>
  futureMenus.value.slice(0, visibleFutureMenusCount.value),
)

const allVisibleFutureMenusSelected = computed(
  () =>
    visibleFutureMenus.value.length > 0 &&
    visibleFutureMenus.value.every((menu) => selectedMenuIds.value.has(menu.documentId)),
)

const toggleSelectAllVisible = () => {
  const next = new Set(selectedMenuIds.value)
  if (allVisibleFutureMenusSelected.value) {
    visibleFutureMenus.value.forEach((menu) => next.delete(menu.documentId))
  } else {
    visibleFutureMenus.value.forEach((menu) => next.add(menu.documentId))
  }
  selectedMenuIds.value = next
}

const loadMoreFutureMenus = () => {
  visibleFutureMenusCount.value += 10
}

const confirmFutureMenus = async () => {
  const weekday = expandedDay.value
  if (!weekday) return
  await deleteFutureMenus(Array.from(selectedMenuIds.value))
  resolvedWeekdays.value.add(weekday)
  showFutureMenusPrompt.value = false
  const action = pendingChange.value
  pendingChange.value = null
  await action?.()
}

const updateAllDeadlines = useDebounceFn(async () => {
  await saveAllDeadlines(`${uniqueDeadline.value}:00`)
}, 1000)

const loadingSkeleton = computed(() => loading.value && scheduleDays.value.length === 0)

const searchProducts = useDebounceFn(() => {
  fetchAvailableProducts({ search: searchQuery.value, pagination: { start: 0 } })
}, 500)

const loadMoreProducts = () => {
  fetchAvailableProducts({
    search: searchQuery.value,
    pagination: { start: availableProducts.value.length },
  })
}

onMounted(async () => {
  await fetchScheduleDays()
})
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('admin.schedule.title') }}</h1>
    </div>

    <div v-if="error" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-800">{{ error }}</p>
    </div>

    <div v-if="loadingSkeleton" class="space-y-4">
      <SkeletonLoader v-for="i in 7" :key="i" height="64px" />
    </div>

    <div v-else class="space-y-3">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-700">{{ t('admin.schedule.deadline') }}</span>
        <input
          :value="uniqueDeadline"
          @input="
            (e) => {
              uniqueDeadline = (e.target as HTMLInputElement).value
            }
          "
          type="time"
          @change="handleDeadlineChange"
          class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div
        v-for="{ weekday, schedule } in allWeekdays"
        :key="weekday"
        class="bg-white rounded-lg shadow-sm border border-gray-200"
        :id="`expanded-day-${weekday}`"
      >
        <div
          class="flex items-center gap-4 p-4 cursor-pointer select-none"
          @click="toggleDay(weekday)"
        >
          <ChevronRight v-if="expandedDay !== weekday" class="w-5 h-5 text-gray-400 shrink-0" />
          <ChevronDown v-else class="w-5 h-5 text-gray-400 shrink-0" />
          <span class="text-sm font-semibold text-gray-900 w-32">
            {{ WEEKDAY_LABELS[weekday] }}
          </span>
          <div class="flex items-center gap-2 ml-auto" @click.stop>
            <span class="text-xs text-gray-400">
              {{ schedule ? t('admin.schedule.saved') : t('admin.schedule.default') }}
            </span>
          </div>
        </div>

        <div
          v-if="expandedDay === weekday && showFutureMenusPrompt"
          class="border-t border-gray-100 px-4 pb-4"
        >
          <div class="py-3">
            <h4 class="text-sm font-medium text-gray-900 mb-1">
              {{ t('admin.schedule.futureMenusTitle') }}
            </h4>
            <p class="text-xs text-gray-500 mb-3">
              {{ t('admin.schedule.futureMenusDescription') }}
            </p>

            <div v-if="checkingFutureMenus" class="space-y-2">
              <SkeletonLoader v-for="i in 3" :key="i" height="40px" />
            </div>
            <div v-else class="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              <div
                class="flex items-center gap-3 px-3 py-2 bg-gray-100 text-xs font-medium text-gray-500 uppercase"
              >
                <input
                  type="checkbox"
                  :checked="allVisibleFutureMenusSelected"
                  @change="toggleSelectAllVisible"
                />
                <span>{{ t('admin.schedule.futureMenusDate') }}</span>
                <span class="ml-auto">{{ t('admin.schedule.futureMenusItems') }}</span>
              </div>
              <div
                v-for="menu in visibleFutureMenus"
                :key="menu.documentId"
                class="flex items-center gap-3 px-3 py-2 border-t border-gray-200"
              >
                <input
                  type="checkbox"
                  :checked="selectedMenuIds.has(menu.documentId)"
                  @change="toggleMenuSelection(menu.documentId)"
                />
                <span class="text-sm text-gray-900">{{ menu.day }}</span>
                <span class="ml-auto text-xs text-gray-500">
                  {{ menu.items.map((item) => item.name).join(', ') || '-' }}
                </span>
              </div>
              <div
                v-if="visibleFutureMenusCount < futureMenus.length"
                class="flex justify-center py-2 border-t border-gray-200"
              >
                <Button @click="loadMoreFutureMenus" variant="ghost" size="sm">
                  {{ t('utils.loadMore') }}
                </Button>
              </div>
            </div>

            <div class="flex justify-end mt-3">
              <Button @click="confirmFutureMenus" :disabled="saving">
                {{
                  selectedMenuIds.size > 0
                    ? t('admin.schedule.futureMenusDeleteAndContinue')
                    : t('admin.schedule.futureMenusContinue')
                }}
              </Button>
            </div>
          </div>
        </div>

        <div
          v-else-if="expandedDay === weekday"
          class="border-t border-gray-100 px-4 pb-4"
        >
          <div class="py-3">
            <div v-if="expandedItemsByCategory.length === 0" class="text-gray-500 text-center py-4">
              {{ t('admin.schedule.noItems') }}
            </div>
            <div v-else class="space-y-4">
              <div v-for="categoryGroup in expandedItemsByCategory" :key="categoryGroup.category">
                <h4 class="text-sm font-medium text-gray-700 mb-2">{{ categoryGroup.category }}</h4>
                <div class="space-y-2">
                  <div
                    v-for="item in categoryGroup.items"
                    :key="item.documentId"
                    class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span class="text-gray-900">{{ item.name }}</span>
                    <Button
                      @click="handleRemoveProduct(weekday, item.documentId)"
                      :disabled="saving"
                      variant="ghost"
                      size="sm"
                    >
                      <Trash2 class="w-4 h-4" />
                      {{ t('admin.remove') }}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="py-3">
            <h4 class="text-xs font-medium text-gray-500 uppercase mb-2">
              {{ t('admin.schedule.addProducts') }}
            </h4>
            <input
              v-model="searchQuery"
              @input="searchProducts"
              type="text"
              :placeholder="t('admin.schedule.searchProducts')"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
            />
            <div
              v-if="availableProductsToAdd.length === 0"
              class="text-xs text-gray-400 text-center py-3"
            >
              {{ t('admin.schedule.noAvailableProducts') }}
            </div>
            <div v-else class="space-y-1">
              <Button
                v-for="product in availableProductsToAdd"
                :key="product.documentId"
                @click="handleAddProduct(weekday, product.documentId)"
                :disabled="saving"
                variant="ghost"
                class="w-full justify-start text-sm"
              >
                <div class="flex items-center justify-between w-full">
                  <span class="text-gray-900">{{ product.name }}</span>
                  <span class="text-xs text-gray-500">{{ product.category?.name }}</span>
                </div>
              </Button>
            </div>
            <div
              v-if="availableProducts.length < totalAvailableProducts"
              class="flex justify-center mt-2"
            >
              <Button @click="loadMoreProducts" :disabled="saving" variant="ghost" size="sm">
                {{ t('utils.loadMore') }}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
