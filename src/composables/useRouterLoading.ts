import { ref, nextTick } from 'vue'

const isLoading = ref(false)
const routeKey = ref(0)
const hideView = ref(false)

export function useRouterLoading() {
  const setLoading = (value: boolean) => {
    if (value && !isLoading.value) {
      // Hide view immediately
      hideView.value = true
      // Increment key on next tick to ensure hide happens first
      nextTick(() => {
        routeKey.value++
      })
    }
    isLoading.value = value
    if (!value) {
      // Show view when loading finishes
      hideView.value = false
    }
  }

  return {
    isLoading,
    routeKey,
    hideView,
    setLoading,
  }
}
