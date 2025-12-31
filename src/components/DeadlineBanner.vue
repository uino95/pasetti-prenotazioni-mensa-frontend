<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import SkeletonLoader from './SkeletonLoader.vue'
import { Button } from '@/components/ui/button'

const { t } = useI18n()
const router = useRouter()

const props = defineProps<{
  canOrder: boolean
  timeRemaining: string
  deadline?: string
  loading?: boolean
  hasOrder?: boolean
  showOrderLink?: boolean
}>()

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
        <Button @click="navigateToOrder" size="sm">
          {{ t('deadline.viewOrder') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
