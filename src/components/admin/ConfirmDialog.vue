<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  show: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: undefined,
  cancelText: undefined,
  variant: 'danger',
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
  emit('cancel')
}

const variantClasses = {
  danger: 'bg-red-600 hover:bg-red-700',
  warning: 'bg-yellow-600 hover:bg-yellow-700',
  info: 'bg-blue-600 hover:bg-blue-700',
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      @click.self="handleCancel"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ title }}</h3>
          <p class="text-gray-600 mb-6">{{ message }}</p>
          <div class="flex justify-end gap-3">
            <button
              @click="handleCancel"
              class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {{ defaultCancelText }}
            </button>
            <button
              @click="handleConfirm"
              :class="[
                'px-4 py-2 text-white rounded-lg transition-colors',
                variantClasses[variant],
              ]"
            >
              {{ defaultConfirmText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped></style>

