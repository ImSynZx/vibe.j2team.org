<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import Icon from './AppIcon.vue'
import MovieList from './MovieList.vue'
import { useOphim } from '../composables/useOphim'
import { useHistory } from '../composables/useHistory'
import type { OphimResponse, EpisodeData, MovieItem } from '../types'

const props = defineProps<{
  slug: string
}>()

const emit = defineEmits<{
  back: []
  'select-movie': [movie: MovieItem]
}>()

const { getMovieDetail, getMoviesByCategory, isLoading, error } = useOphim()
const { addToHistory, toggleBookmark, isBookmarked } = useHistory()

const movieData = ref<OphimResponse | null>(null)
const selectedEpisode = ref<EpisodeData | null>(null)
const currentServer = ref(0)
const iframeKey = ref(0)
const relatedMovies = ref<MovieItem[]>([])

const bookmarked = computed(() => {
  return movieData.value?.movie ? isBookmarked(movieData.value.movie.slug) : false
})

const fetchDetail = async () => {
  const res = await getMovieDetail(props.slug)
  if (res && res.movie) {
    movieData.value = res
    if (res.episodes && res.episodes.length > 0) {
      // Auto select first episode
      const firstServer = res.episodes[0]
      if (firstServer && firstServer.server_data && firstServer.server_data.length > 0) {
        const firstEp = firstServer.server_data[0]
        if (firstEp) selectEpisode(firstEp, 0)
      }
    }

    if (res.movie.category && res.movie.category.length > 0) {
      const catSlug = res.movie.category[0]?.slug
      if (catSlug) {
        const relatedRes = await getMoviesByCategory(catSlug, 1)
        if (relatedRes && relatedRes.items) {
          relatedMovies.value = relatedRes.items.filter((m) => m.slug !== props.slug).slice(0, 10)
        }
      }
    }
  }
}

watch(
  () => props.slug,
  () => {
    movieData.value = null
    selectedEpisode.value = null
    relatedMovies.value = []
    fetchDetail()
  },
)

const selectEpisode = (episode: EpisodeData, serverIdx: number) => {
  selectedEpisode.value = episode
  currentServer.value = serverIdx
  iframeKey.value++ // force iframe to reload

  if (movieData.value?.movie) {
    const historyItem = {
      slug: movieData.value.movie.slug,
      name: movieData.value.movie.name,
      thumb_url: movieData.value.movie.thumb_url.startsWith('http')
        ? movieData.value.movie.thumb_url
        : 'https://img.ophim.live/uploads/movies/' + movieData.value.movie.thumb_url,
      last_watched: Date.now(),
      episode_name: episode.name,
      episode_current: movieData.value.movie.episode_current,
      time: movieData.value.movie.time,
      quality: movieData.value.movie.quality,
      year: movieData.value.movie.year,
      categories: movieData.value.movie.category?.map((c) => c.name) || [],
    }
    addToHistory(historyItem)
  }
}

const handleBookmark = () => {
  if (movieData.value?.movie) {
    const historyItem = {
      slug: movieData.value.movie.slug,
      name: movieData.value.movie.name,
      thumb_url: movieData.value.movie.thumb_url.startsWith('http')
        ? movieData.value.movie.thumb_url
        : 'https://img.ophim.live/uploads/movies/' + movieData.value.movie.thumb_url,
      last_watched: Date.now(),
      episode_current: movieData.value.movie.episode_current,
      time: movieData.value.movie.time,
      quality: movieData.value.movie.quality,
      year: movieData.value.movie.year,
      categories: movieData.value.movie.category?.map((c) => c.name) || [],
    }
    toggleBookmark(historyItem)
  }
}

onMounted(() => {
  fetchDetail()
})

const posterUrl = computed(() => {
  if (!movieData.value?.movie) return ''
  const url = movieData.value.movie.poster_url || movieData.value.movie.thumb_url
  return url.startsWith('http') ? url : 'https://img.ophim.live/uploads/movies/' + url
})

const thumbUrl = computed(() => {
  if (!movieData.value?.movie) return ''
  const url = movieData.value.movie.thumb_url
  return url.startsWith('http') ? url : 'https://img.ophim.live/uploads/movies/' + url
})
</script>

<template>
  <div v-if="isLoading && !movieData" class="flex items-center justify-center py-20">
    <Icon icon="ph:spinner-gap-bold" class="h-8 w-8 animate-spin text-accent-coral" />
  </div>

  <div v-else-if="error" class="border border-red-500/20 bg-red-500/10 p-4 text-red-500">
    {{ error }}
  </div>

  <div v-else-if="movieData?.movie" class="space-y-8 animate-fade-up">
    <!-- Top Breadcrumb -->
    <nav
      class="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2 whitespace-nowrap overflow-x-auto scrollbar-hide"
    >
      <button
        class="group flex items-center gap-1.5 transition-colors hover:text-accent-coral shrink-0"
        @click="emit('back')"
      >
        <Icon
          icon="ph:arrow-left-bold"
          class="h-4 w-4 transition-transform group-hover:-translate-x-1"
        />
        <span class="font-display shrink-0">Quay lại</span>
      </button>
      <span class="text-text-dim text-xs shrink-0">/</span>
      <span class="truncate font-display text-text-primary hidden sm:block">{{
        movieData.movie.name
      }}</span>
    </nav>

    <!-- Player area if episodes exist -->
    <div v-if="selectedEpisode" class="space-y-6">
      <!-- Video Player (Iframe) -->
      <div
        class="aspect-video w-full overflow-hidden border border-border-default bg-black shadow-lg sm:rounded-xl"
      >
        <iframe
          v-if="selectedEpisode.link_embed"
          :key="iframeKey"
          :src="selectedEpisode.link_embed"
          class="h-full w-full border-0"
          allowfullscreen
        ></iframe>
      </div>
    </div>

    <!-- Episode list -->
    <div
      v-if="movieData.episodes && movieData.episodes.length > 0"
      class="space-y-6 border border-border-default bg-bg-surface p-4 sm:p-6 rounded-xl"
    >
      <h3 class="flex items-center gap-3 font-display text-xl font-semibold text-text-primary mb-4">
        <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
        Danh sách tập
      </h3>

      <div v-for="(server, sIdx) in movieData.episodes" :key="sIdx" class="space-y-4">
        <h4 class="font-display text-sm font-semibold text-text-dim">
          Server: {{ server.server_name }}
        </h4>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="ep in server.server_data"
            :key="ep.slug"
            class="flex items-center justify-center border px-4 py-2 text-sm transition-colors"
            :class="[
              selectedEpisode?.slug === ep.slug && currentServer === sIdx
                ? 'border-accent-coral bg-accent-coral text-bg-deep font-bold'
                : 'border-border-default bg-bg-elevated text-text-secondary hover:border-accent-coral hover:text-text-primary',
            ]"
            @click="selectEpisode(ep, sIdx)"
          >
            {{ ep.name }}
          </button>
        </div>
      </div>
    </div>

    <!-- Movie Info Hero -->
    <div
      class="relative overflow-hidden border border-border-default bg-bg-surface p-4 sm:p-6 md:p-8 rounded-xl"
    >
      <!-- Background blur -->
      <div
        class="absolute inset-0 z-0 bg-cover bg-center opacity-10 blur-xl"
        :style="{ backgroundImage: `url(${posterUrl})` }"
      ></div>
      <div class="absolute inset-0 z-0 bg-bg-deep/80"></div>

      <div class="relative z-10 flex flex-col gap-6 md:flex-row md:items-start lg:gap-10">
        <!-- Thumbnail -->
        <div class="w-32 mx-auto shrink-0 sm:w-64 md:w-56 lg:w-72">
          <img
            :src="thumbUrl"
            :alt="movieData.movie.name"
            class="aspect-[2/3] w-full object-cover shadow-2xl ring-1 ring-border-default"
          />
        </div>

        <!-- Details -->
        <div class="flex-1 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1
                class="font-display text-2xl sm:text-3xl font-bold text-text-primary md:text-4xl lg:text-2xl"
              >
                {{ movieData.movie.name }}
              </h1>
              <p class="font-display text-base sm:text-lg text-text-secondary mt-1">
                {{ movieData.movie.origin_name }} ({{ movieData.movie.year }})
              </p>
            </div>

            <button
              class="flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 font-display text-sm font-bold transition-all w-full sm:w-auto shrink-0 shadow-sm"
              :class="
                bookmarked
                  ? 'border-accent-coral bg-accent-coral/10 text-accent-coral shadow-accent-coral/10'
                  : 'border-border-default bg-bg-elevated text-text-primary hover:border-accent-coral hover:text-accent-coral hover:bg-bg-surface'
              "
              @click="handleBookmark"
            >
              <Icon
                :icon="bookmarked ? 'ph:bookmark-simple-fill' : 'ph:bookmark-simple'"
                class="h-5 w-5 shrink-0"
              />
            </button>
          </div>

          <div class="flex flex-wrap items-center gap-3 font-display text-sm md:text-base">
            <span class="rounded bg-accent-coral px-2.5 py-1 font-bold text-bg-deep">{{
              movieData.movie.quality
            }}</span>
            <span class="rounded bg-bg-elevated px-2.5 py-1 text-text-primary">{{
              movieData.movie.episode_current
            }}</span>
            <span
              v-if="movieData.movie.time"
              class="rounded bg-bg-elevated px-2.5 py-1 text-text-primary"
              >{{ movieData.movie.time }}</span
            >
            <span
              v-if="movieData.movie.modified?.time"
              class="flex items-center gap-1.5 rounded border border-border-default px-2.5 py-1 text-text-secondary"
              title="Cập nhật gần nhất"
            >
              <Icon icon="ph:calendar-blank" class="h-4 w-4" />
              {{ new Date(movieData.movie.modified.time).toLocaleDateString('vi-VN') }}
            </span>
            <span
              v-if="movieData.movie.tmdb?.vote_average"
              class="flex items-center gap-1.5 rounded bg-accent-amber/10 border border-accent-amber text-accent-amber px-2.5 py-1 font-bold"
              title="Điểm đánh giá"
            >
              <Icon icon="ph:star-fill" class="h-4 w-4 pb-[1px]" />
              {{ movieData.movie.tmdb.vote_average.toFixed(1) }}
            </span>
          </div>

          <div
            v-if="movieData.movie.country?.length"
            class="mt-3 flex items-center gap-2 font-display text-sm text-text-secondary"
          >
            <span class="font-semibold text-text-primary">Quốc gia:</span>
            <span>{{ movieData.movie.country.map((c) => c.name).join(', ') }}</span>
          </div>

          <!-- Categories -->
          <div
            v-if="movieData.movie.category?.length"
            class="flex flex-wrap gap-2 text-sm text-accent-sky"
          >
            <span v-for="cat in movieData.movie.category" :key="cat.id"> #{{ cat.name }} </span>
          </div>

          <!-- Content -->
          <div class="prose prose-sm md:prose-base prose-invert mt-6 text-text-secondary">
            <h3
              class="font-display text-lg font-semibold text-text-primary mb-2 flex items-center gap-2"
            >
              <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
              Nội dung phim
            </h3>
            <div
              v-html="movieData.movie.content"
              class="line-clamp-6 hover:line-clamp-none transition-all"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Related Movies -->
    <div v-if="relatedMovies.length > 0" class="space-y-6 pb-6 mt-6">
      <h3 class="font-display text-xl font-semibold text-text-primary flex items-center gap-3">
        <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
        Có thể bạn sẽ thích
      </h3>
      <MovieList :movies="relatedMovies" layout="row" @click="emit('select-movie', $event)" />
    </div>
  </div>
</template>

<style scoped>
.prose :deep(p) {
  margin-bottom: 0.5em;
}
.prose :deep(br) {
  display: block;
  content: '';
  margin-top: 0.5em;
}
</style>
