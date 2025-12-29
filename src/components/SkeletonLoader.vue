<script setup lang="ts">
import { computed } from 'vue'

type SkeletonVariant = 'default' | 'circular' | 'rectangular' | 'rounded'

const props = withDefaults(
  defineProps<{
    /**
     * Variant of the skeleton shape
     * @default 'default'
     */
    variant?: SkeletonVariant
    /**
     * Width of the skeleton (e.g., '100%', '200px', '50%')
     * @default '100%'
     */
    width?: string
    /**
     * Height of the skeleton (e.g., '20px', '1rem', '100%')
     * @default '1rem'
     */
    height?: string
    /**
     * Number of lines for text variant
     * @default 1
     */
    lines?: number
    /**
     * Whether to show animation
     * @default true
     */
    animated?: boolean
    /**
     * Additional CSS classes
     */
    customClass?: string
  }>(),
  {
    variant: 'default',
    width: '100%',
    height: '1rem',
    lines: 1,
    animated: true,
    customClass: '',
  },
)

const skeletonClasses = computed(() => {
  const baseClasses = 'bg-gray-200'
  const variantClasses = {
    default: 'rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg',
  }
  const animationClass = props.animated ? 'animate-pulse' : ''
  return `${baseClasses} ${variantClasses[props.variant]} ${animationClass} ${props.customClass}`.trim()
})

const skeletonStyle = computed(() => {
  return {
    width: props.variant === 'circular' ? props.height : props.width,
    height: props.height,
  }
})
</script>

<template>
  <div :class="skeletonClasses" :style="skeletonStyle" aria-label="Loading skeleton" />
</template>

<style scoped></style>

