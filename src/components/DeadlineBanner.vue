<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { timeUntilDeadline } from '@/utils/date'

const { t } = useI18n()

const props = defineProps<{
  deadline: string
  canOrder: boolean
}>()

const timeRemaining = computed(() => timeUntilDeadline(props.deadline))
</script>

<template>
  <div
    class="p-4 rounded-lg mb-4"
    :class="
      canOrder
        ? 'bg-green-50 border border-green-200 text-green-800'
        : 'bg-red-50 border border-red-200 text-red-800'
    "
  >
    <div class="flex items-center justify-between">
      <div>
        <p class="font-medium">
          {{
            canOrder
              ? t('deadline.canOrder', { deadline })
              : t('deadline.passed')
          }}
        </p>
        <p v-if="canOrder" class="text-sm mt-1">
          {{ t('deadline.timeRemaining', { time: timeRemaining }) }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped></style>

