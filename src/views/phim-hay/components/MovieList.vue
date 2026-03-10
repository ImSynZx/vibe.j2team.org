<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { MovieItem } from '../types'
import MovieCard from './MovieCard.vue'
import Icon from './AppIcon.vue'

const props = withDefaults(
  defineProps<{
    movies: MovieItem[]
    layout?: 'grid' | 'row' | 'poster'
    autoScroll?: boolean
  }>(),
  {
    layout: 'grid',
    autoScroll: false,
  },
)

const emit = defineEmits<{
  click: [movie: MovieItem]
}>()

const scrollContainer = ref<HTMLElement | null>(null)
let scrollInterval: number | null = null

const scrollLeft = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollBy({ left: -300, behavior: 'smooth' })
  }
}

const scrollRight = () => {
  if (scrollContainer.value) {
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainer.value
    // If reached the end, loop back smoothly
    if (scrollLeft + clientWidth >= scrollWidth - 10) {
      scrollContainer.value.scrollTo({ left: 0, behavior: 'smooth' })
    } else {
      scrollContainer.value.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }
}

const startAutoScroll = () => {
  if ((props.layout === 'row' || props.layout === 'poster') && props.autoScroll) {
    scrollInterval = window.setInterval(scrollRight, 3000)
  }
}

const stopAutoScroll = () => {
  if (scrollInterval) {
    window.clearInterval(scrollInterval)
    scrollInterval = null
  }
}

onMounted(() => {
  startAutoScroll()
})

onUnmounted(() => {
  stopAutoScroll()
})
</script>

<template>
  <div
    v-if="layout === 'grid'"
    class="grid gap-4 sm:gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5"
  >
    <MovieCard
      v-for="movie in props.movies"
      :key="movie._id"
      :movie="movie"
      :layout="layout"
      @click="emit('click', $event)"
    />
  </div>

  <div
    v-else
    class="relative group/list"
    @mouseenter="stopAutoScroll"
    @mouseleave="startAutoScroll"
  >
    <!-- Left Arrow -->
    <button
      @click="scrollLeft"
      class="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden h-14 w-8 flex-col items-center justify-center bg-bg-deep/90 text-white transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep group-hover/list:flex shadow-lg rounded-r-xl border border-white/10"
    >
      <Icon icon="ph:caret-left-bold" class="h-5 w-5" />
    </button>

    <div
      ref="scrollContainer"
      class="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide scroll-smooth"
    >
      <MovieCard
        v-for="movie in props.movies"
        :key="movie._id"
        :movie="movie"
        :layout="layout"
        @click="emit('click', $event)"
      />
    </div>

    <!-- Right Arrow -->
    <button
      @click="scrollRight"
      class="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden h-14 w-8 flex-col items-center justify-center bg-bg-deep/90 text-white transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep group-hover/list:flex shadow-lg rounded-l-xl border border-white/10"
    >
      <Icon icon="ph:caret-right-bold" class="h-5 w-5" />
    </button>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
