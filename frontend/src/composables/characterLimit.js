import { computed, unref } from 'vue'

export function useCharacterLimit(value, limit = 100) {
  const length = computed(() => {
    const currentValue = typeof value === 'function' ? value() : unref(value)
    return String(currentValue ?? '').length
  })

  const isAtLimit = computed(() => length.value >= limit)

  return { length, isAtLimit }
}
