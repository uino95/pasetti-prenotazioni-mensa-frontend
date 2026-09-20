<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { type Order, type OrderItemFullyPopulated } from '@/api/orders'
import type { MenuItem } from '@/api/admin/menus'
import MenuCard from '@/components/MenuCard.vue'
import { Button } from '@/components/ui/button'

interface Props {
  show: boolean
  order: Order<OrderItemFullyPopulated> | null
  menuItems: MenuItem[]
  saving?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  saving: false,
})

const emit = defineEmits<{
  cancel: []
  save: [payload: { itemIds: string[]; note: string }]
}>()

const { t } = useI18n()

const selectedItems = ref<MenuItem[]>([])
const note = ref('')

watch(
  () => [props.show, props.order, props.menuItems] as const,
  ([show, order]) => {
    if (!show || !order) return
    const orderItemIds = new Set(order.items?.map((item) => item.documentId) || [])
    selectedItems.value = props.menuItems.filter((item) => orderItemIds.has(item.documentId))
    note.value = order.note || ''
  },
  { immediate: true },
)

const selectedItemIds = computed(() => selectedItems.value.map((item) => item.documentId))

const itemsByCategory = computed(() => {
  const grouped = new Map<string, MenuItem[]>()
  props.menuItems.forEach((item) => {
    const categoryName = item.category?.name || 'Altro'
    if (!grouped.has(categoryName)) {
      grouped.set(categoryName, [])
    }
    grouped.get(categoryName)!.push(item)
  })
  return Array.from(grouped.entries())
    .sort((a, b) => {
      const aOrder = a[1][0]?.category?.order ?? 9999
      const bOrder = b[1][0]?.category?.order ?? 9999
      return aOrder - bOrder
    })
    .map(([category, items]) => ({ category, items }))
})

const toggleItem = (itemId: string) => {
  const item = props.menuItems.find((i) => i.documentId === itemId)
  if (!item) return

  const categoryId = item.category?.documentId || null
  const isAlreadySelected = selectedItems.value.some((i) => i.documentId === itemId)

  if (isAlreadySelected) {
    selectedItems.value = selectedItems.value.filter((i) => i.documentId !== itemId)
  } else {
    selectedItems.value = selectedItems.value.filter(
      (selectedItem) => (selectedItem.category?.documentId || null) !== categoryId,
    )
    selectedItems.value.push(item)
  }
}

const userName = () => props.order?.user?.username || props.order?.user?.email || '—'

const handleCancel = () => {
  emit('cancel')
}

const handleSave = () => {
  emit('save', { itemIds: selectedItemIds.value, note: note.value })
}
</script>
<template>
  <Teleport to="body">
    <div
      v-if="show && order"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="handleCancel"
    >
      <div
        class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div class="p-6 pb-2">
          <h2 class="text-lg font-semibold text-gray-900 mb-1">
            {{ t('admin.orders.edit_title') }}
          </h2>
          <p class="text-sm text-gray-600">{{ userName() }}</p>
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <div v-if="menuItems.length === 0" class="text-gray-600">
            {{ t('admin.menus.noItems') }}
          </div>

          <div v-for="categoryGroup in itemsByCategory" v-else :key="categoryGroup.category">
            <h3 class="text-lg font-semibold text-gray-800 mb-2 px-2">
              {{ categoryGroup.category }}
            </h3>
            <div class="overflow-x-auto">
              <table
                class="w-full border-collapse bg-white rounded-lg shadow-sm border border-gray-200"
              >
                <tbody>
                  <MenuCard
                    v-for="item in categoryGroup.items"
                    :key="item.documentId"
                    :item="item"
                    :category="categoryGroup.category"
                    :selected="selectedItems.some((i) => i.documentId === item.documentId)"
                    @toggle="toggleItem"
                  />
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <label for="order-edit-note" class="block text-sm font-medium text-gray-700 mb-1">
              {{ t('order.note') }}
            </label>
            <textarea
              id="order-edit-note"
              v-model="note"
              :placeholder="t('order.notePlaceholder')"
              rows="3"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div class="p-6 pt-2 flex justify-end gap-3 border-t border-gray-100">
          <Button variant="secondary" @click="handleCancel" :disabled="saving">
            {{ t('admin.cancel') }}
          </Button>
          <Button @click="handleSave" :disabled="saving">
            {{ saving ? t('admin.loading') : t('admin.save') }}
          </Button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
