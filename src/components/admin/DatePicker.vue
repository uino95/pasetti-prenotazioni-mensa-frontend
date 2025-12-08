<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  modelValue: Date | string | null
  label?: string
  min?: string
  max?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: undefined,
  min: undefined,
  max: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const dateValue = ref<string>('')
const inputRef = ref<HTMLInputElement | null>(null)

// Convert modelValue to string format for input
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      const date = typeof newValue === 'string' ? new Date(newValue) : newValue
      dateValue.value = date.toISOString().split('T')[0] || ''
    } else {
      dateValue.value = ''
    }
  },
  { immediate: true },
)

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  dateValue.value = target.value
  emit('update:modelValue', target.value)
}

const handleClick = () => {
  // Use showPicker() API if available (modern browsers)
  if (inputRef.value && 'showPicker' in inputRef.value) {
    inputRef.value.showPicker()
  }
}
</script>

<template>
  <div>
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
    </label>
    <input
      ref="inputRef"
      type="date"
      :value="dateValue"
      :min="min"
      :max="max"
      @input="handleInput"
      @click="handleClick"
      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  </div>
</template>

<style scoped></style>
