<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="cancelMonthSelection"
    >
    <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
      <h2 class="text-xl font-bold text-gray-900 mb-4">
        {{ t('admin.menus.selectMonth') }}
      </h2>
      <p class="text-sm text-gray-600 mb-4">
        {{ description }}
      </p>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {{ t('admin.menus.year') }}
          </label>
          <input
            v-model.number="selectedYear"
            type="number"
            :min="new Date().getFullYear() - 1"
            :max="new Date().getFullYear() + 1"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {{ t('admin.menus.month') }}
          </label>
          <select
            v-model.number="selectedMonth"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option :value="0">{{ t('admin.menus.january') }}</option>
            <option :value="1">{{ t('admin.menus.february') }}</option>
            <option :value="2">{{ t('admin.menus.march') }}</option>
            <option :value="3">{{ t('admin.menus.april') }}</option>
            <option :value="4">{{ t('admin.menus.may') }}</option>
            <option :value="5">{{ t('admin.menus.june') }}</option>
            <option :value="6">{{ t('admin.menus.july') }}</option>
            <option :value="7">{{ t('admin.menus.august') }}</option>
            <option :value="8">{{ t('admin.menus.september') }}</option>
            <option :value="9">{{ t('admin.menus.october') }}</option>
            <option :value="10">{{ t('admin.menus.november') }}</option>
            <option :value="11">{{ t('admin.menus.december') }}</option>
          </select>
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-6">
        <Button variant="outline" @click="cancelMonthSelection">
          {{ t('admin.cancel') }}
        </Button>
        <Button @click="confirmMonthSelection" :disabled="isLoading">
          {{ t('admin.confirm') }}
          </Button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'

interface Props {
  isLoading: boolean
  show: boolean
  description: string
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
  show: false,
  description: '',
})

const emit = defineEmits<{
  cancel: []
  confirm: [data: { year: number; month: number }]
}>()

const { t } = useI18n()

const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth())

const cancelMonthSelection = () => {
  emit('cancel')
}

const confirmMonthSelection = () => {
  emit('confirm', { year: selectedYear.value, month: selectedMonth.value })
}
</script>
