<script setup lang="ts">
import { computed } from 'vue'
import Icon from './AppIcon.vue'

const props = defineProps<{
  currentPage: number
  totalPages: number
}>()

const emit = defineEmits<{
  pageChange: [page: number]
}>()

const pages = computed(() => {
  const current = props.currentPage
  const total = props.totalPages

  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  if (current <= 3) {
    return [1, 2, 3, 4, 5, '...', total]
  }

  if (current >= total - 2) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  }

  return [1, '...', current - 1, current, current + 1, '...', total]
})

const setPage = (page: number | string) => {
  if (typeof page === 'number' && page >= 1 && page <= props.totalPages) {
    emit('pageChange', page)
  }
}
</script>

<template>
  <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 font-display">
    <button
      class="flex h-10 w-10 items-center justify-center border border-border-default bg-bg-surface text-text-secondary transition-colors hover:border-accent-coral hover:text-text-primary disabled:opacity-50 disabled:hover:border-border-default disabled:hover:text-text-secondary"
      :disabled="currentPage === 1"
      @click="setPage(currentPage - 1)"
    >
      <Icon icon="ph:caret-left-bold" />
    </button>

    <button
      v-for="page in pages"
      :key="page"
      class="flex h-10 w-10 items-center justify-center border transition-colors"
      :class="[
        currentPage === page
          ? 'border-accent-coral bg-accent-coral text-bg-deep font-bold'
          : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-coral hover:text-text-primary',
        typeof page === 'string'
          ? 'pointer-events-none cursor-default border-transparent bg-transparent hover:border-transparent'
          : '',
      ]"
      :disabled="typeof page === 'string'"
      @click="setPage(page)"
    >
      {{ page }}
    </button>

    <button
      class="flex h-10 w-10 items-center justify-center border border-border-default bg-bg-surface text-text-secondary transition-colors hover:border-accent-coral hover:text-text-primary disabled:opacity-50 disabled:hover:border-border-default disabled:hover:text-text-secondary"
      :disabled="currentPage === totalPages"
      @click="setPage(currentPage + 1)"
    >
      <Icon icon="ph:caret-right-bold" />
    </button>
  </div>
</template>
