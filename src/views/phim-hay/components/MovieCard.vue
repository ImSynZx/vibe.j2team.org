<script setup lang="ts">
import { computed } from 'vue'
import Icon from './AppIcon.vue'
import type { MovieItem } from '../types'

const props = withDefaults(
  defineProps<{
    movie: MovieItem
    layout?: 'grid' | 'row' | 'poster'
  }>(),
  {
    layout: 'grid',
  },
)

const emit = defineEmits<{
  click: [movie: MovieItem]
}>()

const imageUrl = computed(() => {
  if (!props.movie) return ''
  const url =
    props.layout === 'poster' && props.movie.poster_url
      ? props.movie.poster_url
      : props.movie.thumb_url
  if (!url) return ''
  return url.startsWith('http') ? url : 'https://img.ophim.live/uploads/movies/' + url
})

const year = computed(() => {
  return props.movie.year || 'N/A'
})
</script>

<template>
  <button
    class="group/card relative flex cursor-pointer flex-col overflow-hidden border border-border-default bg-bg-surface text-left transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
    :class="[
      layout === 'row'
        ? 'w-[150px] sm:w-[180px] md:w-[210px] lg:w-[230px] shrink-0 snap-start'
        : layout === 'poster'
          ? 'w-[260px] sm:w-[280px] md:w-[320px] shrink-0 snap-start'
          : 'w-full',
    ]"
    @click="emit('click', movie)"
  >
    <!-- Thumbnail container -->
    <div
      class="relative w-full overflow-hidden bg-bg-deep"
      :class="[layout === 'poster' ? 'aspect-video' : 'aspect-[2/3]']"
    >
      <img
        :src="imageUrl"
        :alt="movie.name"
        class="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
        loading="lazy"
      />

      <!-- Overlay gradient -->
      <div
        class="absolute inset-0 bg-gradient-to-t from-bg-deep/90 via-bg-deep/20 to-transparent transition-opacity duration-300"
      ></div>

      <!-- Play Icon on Hover -->
      <div
        class="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
      >
        <div class="rounded-full bg-accent-coral/90 p-3 text-bg-deep backdrop-blur-sm">
          <Icon icon="ph:play-fill" class="h-8 w-8" />
        </div>
      </div>

      <!-- Episode/Status Tag -->
      <div class="absolute left-2 top-2 flex flex-col items-start gap-1">
        <div
          v-if="movie.episode_current || movie.quality"
          class="rounded bg-accent-coral px-2 py-1 font-display text-[10px] sm:text-xs font-semibold text-bg-deep shadow-sm"
        >
          {{ movie.episode_current || movie.quality }}
        </div>
        <div
          v-if="movie.lang"
          class="rounded bg-bg-surface/90 border border-white/10 px-2 py-1 font-display text-[10px] sm:text-xs font-semibold text-text-primary backdrop-blur-sm shadow-sm"
        >
          {{ movie.lang }}
        </div>
      </div>
    </div>

    <!-- Details -->
    <div class="flex flex-1 flex-col justify-between p-3 sm:p-4">
      <div>
        <h3
          class="font-display font-semibold text-text-primary transition-colors group-hover/card:text-accent-coral"
          :class="[
            layout === 'row' || layout === 'poster'
              ? 'text-sm line-clamp-1'
              : 'text-base line-clamp-2',
          ]"
          :title="movie.name"
        >
          {{ movie.name }}
        </h3>
        <p class="mt-1 line-clamp-1 text-sm text-text-secondary" :title="movie.origin_name">
          {{ movie.origin_name }}
        </p>
      </div>

      <div class="mt-3 flex items-center justify-between text-xs font-semibold text-text-dim">
        <span class="flex items-center gap-1">
          <Icon icon="ph:calendar-blank" class="h-3.5 w-3.5" />
          {{ year }}
        </span>
        <span v-if="movie.time" class="flex items-center gap-1">
          <Icon icon="ph:clock" class="h-3.5 w-3.5" />
          {{ movie.time }}
        </span>
      </div>
    </div>
  </button>
</template>
