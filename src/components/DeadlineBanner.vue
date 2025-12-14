<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { timeUntilDeadline } from '@/utils/date'
import SkeletonLoader from './SkeletonLoader.vue'

const { t } = useI18n()
const router = useRouter()

const props = defineProps<{
  canOrder: boolean
  deadline?: string
  loading?: boolean
  hasOrder?: boolean
  showOrderLink?: boolean
}>()

const timeRemaining = computed(() => {
  if (!props.deadline) return ''
  return timeUntilDeadline(props.deadline)
})

const bannerClass = computed(() => {
  if (props.canOrder) {
    return 'bg-green-50 border border-green-200 text-green-800'
  } else if (props.hasOrder) {
    return 'bg-blue-50 border border-blue-200 text-blue-800'
  } else {
    return 'bg-red-50 border border-red-200 text-red-800'
  }
})

const message = computed(() => {
  if (props.canOrder) {
    return t('deadline.canOrder', { deadline: props.deadline })
  } else if (props.hasOrder) {
    return t('deadline.orderPlaced')
  } else {
    return t('deadline.passed')
  }
})

const navigateToOrder = () => {
  router.push({ name: 'order' })
}
</script>

<template>
  <SkeletonLoader v-if="loading" height="82px" customClass="mb-4" />
  <div v-else-if="deadline" class="p-4 rounded-lg mb-4" :class="bannerClass">
    <div class="flex items-center justify-between">
      <div class="flex-1">
        <p class="font-medium">
          {{ message }}
        </p>
        <p v-if="canOrder" class="text-sm mt-1">
          {{ t('deadline.timeRemaining', { time: timeRemaining }) }}
        </p>
      </div>
      <div v-if="showOrderLink && hasOrder && !canOrder" class="ml-4">
        <button
          @click="navigateToOrder"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          {{ t('deadline.viewOrder') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
