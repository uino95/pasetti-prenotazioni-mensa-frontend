<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'

interface Props {
  show: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: undefined,
  cancelText: undefined,
  variant: 'danger',
  loading: false,
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()

const defaultConfirmText = props.confirmText || t('admin.confirm')
const defaultCancelText = props.cancelText || t('admin.cancel')

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  if (props.loading) return
  emit('cancel')
}

const confirmButtonVariant = computed(() => {
  if (props.variant === 'danger') return 'destructive'
  return 'default'
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="handleCancel"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ title }}</h3>
          <p class="text-gray-600 mb-6">{{ message }}</p>
          <div class="flex justify-end gap-3">
            <Button @click="handleCancel" variant="secondary" :disabled="loading">
              {{ defaultCancelText }}
            </Button>
            <Button @click="handleConfirm" :variant="confirmButtonVariant" :disabled="loading">
              {{ defaultConfirmText }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped></style>
