<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import Icon from './components/AppIcon.vue'
import { useOphim } from './composables/useOphim'
import { useHistory } from './composables/useHistory'
import MovieList from './components/MovieList.vue'
import AppPagination from './components/AppPagination.vue'
import MovieDetail from './components/MovieDetail.vue'
import type { MovieItem, OphimResponse } from './types'

// Setup
const {
  isLoading,
  error,
  THUMB_BASE,
  getNewMovies,
  searchMovies,
  getMoviesByList,
  getMoviesByCategory,
} = useOphim()
const { watchHistory, bookmarks } = useHistory()

// History Pagination & Format
const historyPage = ref(1)
const historyPerPage = 10
const paginatedHistory = computed(() => {
  const start = (historyPage.value - 1) * historyPerPage
  return watchHistory.value.slice(start, start + historyPerPage)
})
const historyTotalPages = computed(() => Math.ceil(watchHistory.value.length / historyPerPage))

// Bookmarks Pagination
const bookmarkPage = ref(1)
const bookmarkPerPage = 10
const paginatedBookmarks = computed(() => {
  const start = (bookmarkPage.value - 1) * bookmarkPerPage
  return bookmarks.value.slice(start, start + bookmarkPerPage)
})
const bookmarkTotalPages = computed(() => Math.ceil(bookmarks.value.length / bookmarkPerPage))

const formatTimeAgo = (timestamp: number) => {
  if (!timestamp) return ''
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  if (hours < 24) return `${hours} giờ trước`
  if (days < 7) return `${days} ngày trước`
  if (weeks < 4) return `${weeks} tuần trước`
  if (months < 12) return `${months} tháng trước`
  return `${years} năm trước`
}

// State
const activeTab = ref('home')
const selectedMovie = ref<string | null>(null)
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const movies = ref<MovieItem[]>([]) // For list lists (genres, history, etc.)
const searchQuery = ref('')
const searchInput = ref('')

// Dashboard refs
const homeDeCu = ref<MovieItem[]>([])
const homePhimLe = ref<MovieItem[]>([])
const homePhimBo = ref<MovieItem[]>([])
const homeHoatHinh = ref<MovieItem[]>([])

const genresList = [
  { slug: 'hanh-dong', name: 'Hành Động' },
  { slug: 'tinh-cam', name: 'Tình Cảm' },
  { slug: 'hai-huoc', name: 'Hài Hước' },
  { slug: 'co-trang', name: 'Cổ Trang' },
  { slug: 'tam-ly', name: 'Tâm Lý' },
  { slug: 'hinh-su', name: 'Hình Sự' },
  { slug: 'chien-tranh', name: 'Chiến Tranh' },
  { slug: 'the-thao', name: 'Thể Thao' },
  { slug: 'vo-thuat', name: 'Võ Thuật' },
  { slug: 'vien-tuong', name: 'Viễn Tưởng' },
  { slug: 'phieu-luu', name: 'Phiêu Lưu' },
  { slug: 'khoa-hoc', name: 'Khoa Học' },
  { slug: 'kinh-di', name: 'Kinh Dị' },
  { slug: 'am-nhac', name: 'Âm Nhạc' },
  { slug: 'than-thoai', name: 'Thần Thoại' },
  { slug: 'tai-lieu', name: 'Tài Liệu' },
  { slug: 'gia-dinh', name: 'Gia Đình' },
  { slug: 'chinh-kich', name: 'Chính Kịch' },
  { slug: 'bi-an', name: 'Bí Ẩn' },
  { slug: 'hoc-duong', name: 'Học Đường' },
  { slug: 'thoi-thanh-xuan', name: 'Thanh Xuân' },
]
const activeGenre = ref('hanh-dong')

// Tabs
const tabs = [
  { id: 'home', name: 'Mới Cập Nhật', icon: 'ph:clock-countdown' },
  { id: 'phim-le', name: 'Phim Lẻ', icon: 'ph:film-strip' },
  { id: 'phim-bo', name: 'Phim Bộ', icon: 'ph:monitor-play' },
  { id: 'hoat-hinh', name: 'Hoạt Hình', icon: 'ph:ghost' },
  { id: 'genres', name: 'Thể Loại', icon: 'ph:squares-four' },
  { id: 'history', name: 'Lịch sử xem', icon: 'ph:clock' },
  { id: 'bookmarks', name: 'Phim đã lưu', icon: 'ph:bookmark-simple' },
]

// Fetching logic
const fetchMovies = async (page = 1) => {
  movies.value = []
  currentPage.value = page

  const processItems = (items: MovieItem[]) => {
    return (items || []).map((item: MovieItem) => ({
      ...item,
      thumb_url: item.thumb_url?.startsWith('http') ? item.thumb_url : THUMB_BASE + item.thumb_url,
      poster_url: item.poster_url?.startsWith('http')
        ? item.poster_url
        : THUMB_BASE + item.poster_url,
    }))
  }

  const processResponse = (res: OphimResponse | null) => {
    if (res?.data?.items) {
      movies.value = processItems(res.data.items)
      const pag = res.data.params?.pagination
      if (pag) {
        totalItems.value = pag.totalItems || movies.value.length
        totalPages.value =
          pag.totalItems && pag.totalItemsPerPage
            ? Math.ceil(pag.totalItems / pag.totalItemsPerPage)
            : pag.totalPages || 1
      } else {
        totalPages.value = 1
        totalItems.value = movies.value.length
      }
    }
  }

  if (activeTab.value === 'home') {
    // Fetch 4 sections concurrently for Dashboard
    const [resDeCu, resPhimLe, resPhimBo, resHoatHinh] = await Promise.all([
      getNewMovies(1),
      getMoviesByList('phim-le', 1),
      getMoviesByList('phim-bo', 1),
      getMoviesByList('hoat-hinh', 1),
    ])

    homeDeCu.value = processItems(resDeCu?.items || resDeCu?.data?.items || [])
    homePhimLe.value = processItems(resPhimLe?.data?.items || resPhimLe?.items || [])
    homePhimBo.value = processItems(resPhimBo?.data?.items || resPhimBo?.items || [])
    homeHoatHinh.value = processItems(resHoatHinh?.data?.items || resHoatHinh?.items || [])
  } else if (activeTab.value === 'search') {
    if (!searchQuery.value) return
    const res = await searchMovies(searchQuery.value, page)
    processResponse(res)
  } else if (activeTab.value === 'genres') {
    const res = await getMoviesByCategory(activeGenre.value, page)
    processResponse(res)
  } else if (['phim-le', 'phim-bo', 'hoat-hinh'].includes(activeTab.value)) {
    const res = await getMoviesByList(activeTab.value, page)
    processResponse(res)
  }
}

watch(activeTab, () => {
  selectedMovie.value = null
  if (
    activeTab.value !== 'history' &&
    activeTab.value !== 'search' &&
    activeTab.value !== 'bookmarks'
  ) {
    fetchMovies(1)
  }
})

watch(activeGenre, () => {
  if (activeTab.value === 'genres') {
    fetchMovies(1)
  }
})

const handleSearch = () => {
  if (searchInput.value.trim()) {
    searchQuery.value = searchInput.value.trim()
    activeTab.value = 'search'
    fetchMovies(1)
  }
}

const goHome = () => {
  activeTab.value = 'home'
  selectedMovie.value = null
  searchQuery.value = ''
  searchInput.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleMovieClick = (movie: MovieItem | { slug: string }) => {
  selectedMovie.value = movie.slug
}

onMounted(() => {
  fetchMovies(1)
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep font-body text-text-primary relative">
    <!-- Nút vể Web Chính góc nhỏ -->
    <RouterLink
      to="/"
      class="fixed top-3 left-3 md:top-5 md:left-5 z-[60] flex h-10 w-10 items-center justify-center rounded-full bg-bg-surface/60 border border-white/10 text-text-secondary backdrop-blur-md transition-all hover:bg-accent-coral hover:text-bg-deep hover:border-accent-coral shadow-sm hover:shadow-accent-coral/20 hover:-translate-x-1"
      title="Về Trang Chủ VibeWeb"
    >
      <Icon icon="ph:house-line" class="h-5 w-5" />
    </RouterLink>

    <!-- Header -->
    <header
      class="sticky top-0 z-50 border-b border-white/5 bg-bg-deep/70 backdrop-blur-xl shadow-lg transition-all"
    >
      <div class="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-3 sm:px-6">
        <!-- Row 1: Logo & Search -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
          <!-- Click logo resets app state -->
          <button
            @click="goHome"
            class="flex items-center gap-2 group md:ml-12 lg:ml-16 pl-10 sm:pl-0"
          >
            <div
              class="rounded-lg bg-accent-coral/10 p-1.5 transition-colors group-hover:bg-accent-coral/20"
            >
              <Icon icon="ph:film-strip" class="h-6 w-6 text-accent-coral" />
            </div>
            <h1 class="font-display text-2xl font-bold tracking-tight">
              <span class="text-accent-coral drop-shadow-sm">Phim</span>
              <span class="text-text-primary">Hay</span>
            </h1>
          </button>

          <!-- Search Bar -->
          <form @submit.prevent="handleSearch" class="relative w-full sm:w-72 lg:w-96 group">
            <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <Icon
                icon="ph:magnifying-glass"
                class="h-4 w-4 text-text-dim group-focus-within:text-accent-coral transition-colors"
              />
            </div>
            <input
              v-model="searchInput"
              type="text"
              placeholder="Tìm kiếm phim..."
              class="w-full rounded-full border border-white/10 bg-bg-surface/50 py-2.5 pl-11 pr-4 text-sm outline-none backdrop-blur-sm transition-all focus:border-accent-coral focus:bg-bg-surface focus:shadow-[0_0_15px_rgba(255,107,107,0.15)] placeholder:text-text-dim"
            />
          </form>
        </div>

        <!-- Row 2: Navigation Tabs -->
        <nav
          class="flex w-full items-center justify-start gap-2 overflow-x-auto pb-2 scrollbar-hide px-1 flex-nowrap"
        >
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="group flex shrink-0 items-center gap-2 rounded-full px-4 py-2 font-display text-sm font-semibold transition-all relative overflow-hidden"
            :class="[
              activeTab === tab.id
                ? 'bg-accent-coral text-bg-deep shadow-lg shadow-accent-coral/20'
                : 'text-text-secondary hover:bg-bg-surface hover:text-text-primary',
            ]"
            @click="activeTab = tab.id"
          >
            <Icon :icon="tab.icon" class="h-4 w-4 transition-transform group-hover:scale-110" />
            <span>{{ tab.name }}</span>
          </button>
        </nav>
      </div>
    </header>

    <!-- Genres Full Grid -->
    <div
      v-if="activeTab === 'genres' && !selectedMovie"
      class="border-b border-border-default bg-bg-surface/30 pt-6 pb-4"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6">
        <div class="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div
              class="h-8 w-8 flex items-center justify-center rounded-lg bg-accent-amber/10 text-accent-amber"
            >
              <Icon icon="ph:squares-four" class="w-5 h-5" />
            </div>
            <span class="text-sm font-semibold text-text-secondary">Chọn Thể Loại:</span>
          </div>
          <div
            class="text-xs font-display font-medium px-3 py-1.5 rounded-full bg-bg-deep border border-border-default text-text-secondary self-start sm:self-auto"
          >
            Tìm thấy <span class="text-accent-coral font-bold">{{ totalItems }}</span> phim
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="genre in genresList"
            :key="genre.slug"
            @click="activeGenre = genre.slug"
            class="px-4 py-2 rounded-lg text-xs font-semibold transition-all border"
            :class="
              activeGenre === genre.slug
                ? 'bg-accent-amber border-accent-amber text-bg-deep shadow-md'
                : 'bg-bg-deep border-border-default text-text-secondary hover:border-accent-amber/50 hover:text-text-primary'
            "
          >
            {{ genre.name }}
          </button>
        </div>
      </div>
    </div>

    <main class="mx-auto max-w-7xl px-2 sm:px-4 py-6 sm:py-8 md:px-6">
      <MovieDetail
        v-if="selectedMovie"
        :slug="selectedMovie"
        @back="selectedMovie = null"
        @select-movie="handleMovieClick"
      />

      <div v-else>
        <!-- Loading State -->
        <div v-if="isLoading" class="flex min-h-[50vh] flex-col items-center justify-center gap-4">
          <Icon icon="ph:spinner-gap-bold" class="h-10 w-10 animate-spin text-accent-coral" />
          <p class="font-display font-semibold text-text-secondary animate-pulse">
            Đang tải dữ liệu...
          </p>
        </div>

        <!-- Error State -->
        <div
          v-else-if="error"
          class="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center"
        >
          <div class="rounded-full bg-accent-coral/10 p-4 text-accent-coral">
            <Icon icon="ph:ghost" class="h-12 w-12" />
          </div>
          <p class="font-display text-lg font-semibold text-text-primary">Đã xảy ra lỗi</p>
          <p class="text-text-secondary">{{ error }}</p>
          <button
            @click="fetchMovies(currentPage)"
            class="mt-4 rounded-full bg-accent-coral px-6 py-2 font-display font-semibold text-bg-deep transition-colors hover:bg-accent-coral/90"
          >
            Thử Lại
          </button>
        </div>

        <!-- Bookmarks Tab -->
        <div v-else-if="activeTab === 'bookmarks'" class="space-y-12 flex-1">
          <section>
            <h2
              class="mb-6 flex items-center gap-3 font-display text-2xl font-semibold text-text-primary"
            >
              <div
                class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-amber/20 text-accent-amber"
              >
                <Icon icon="ph:bookmark-simple-fill" class="h-5 w-5" />
              </div>
              Phim đang theo dõi
            </h2>
            <div
              v-if="bookmarks.length === 0"
              class="rounded-xl border border-dashed border-border-default p-12 flex flex-col items-center gap-3 text-center text-text-secondary"
            >
              <Icon icon="ph:bookmark-simple-dashed" class="h-10 w-10 opacity-50" />
              <p>Bạn chưa theo dõi phim nào.</p>
              <button
                @click="goHome"
                class="mt-2 text-accent-coral font-medium text-sm hover:underline"
              >
                Khám phá phim ngay
              </button>
            </div>
            <div
              v-else
              class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
            >
              <button
                v-for="movie in paginatedBookmarks"
                :key="movie.slug"
                class="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl bg-bg-surface text-left transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-accent-amber/5"
                @click="handleMovieClick(movie)"
              >
                <div class="aspect-[2/3] w-full bg-bg-deep">
                  <img
                    :src="movie.thumb_url"
                    :alt="movie.name"
                    class="h-full w-full object-cover opacity-90 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                    loading="lazy"
                  />
                  <div
                    class="absolute right-2 top-2 rounded bg-accent-amber px-2 py-1 text-xs font-bold text-bg-deep shadow-md"
                  >
                    Đã Lưu
                  </div>
                </div>
                <div class="p-3">
                  <h3
                    class="line-clamp-2 font-display text-sm font-semibold transition-colors group-hover:text-accent-amber"
                  >
                    {{ movie.name }}
                  </h3>
                </div>
              </button>
            </div>
            <div v-if="bookmarkTotalPages > 1" class="mt-8 flex justify-center">
              <AppPagination
                :current-page="bookmarkPage"
                :total-pages="bookmarkTotalPages"
                @page-change="(p) => (bookmarkPage = p)"
              />
            </div>
          </section>
        </div>

        <!-- History Tab -->
        <div v-else-if="activeTab === 'history'" class="space-y-12 flex-1">
          <!-- Timeline History -->
          <section>
            <h2
              class="mb-6 flex items-center gap-3 font-display text-2xl font-semibold text-text-primary"
            >
              <div
                class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-sky/20 text-accent-sky"
              >
                <Icon icon="ph:clock" class="h-5 w-5" />
              </div>
              Phim đã xem gần đây
            </h2>
            <div
              v-if="watchHistory.length === 0"
              class="rounded-xl border border-dashed border-border-default p-12 flex flex-col items-center gap-3 text-center text-text-secondary"
            >
              <Icon icon="ph:clock-dashed" class="h-10 w-10 opacity-50" />
              <p>Lịch sử xem phim trống.</p>
              <button
                @click="goHome"
                class="mt-2 text-accent-coral font-medium text-sm hover:underline"
              >
                Hãy xem thử một bộ phim
              </button>
            </div>
            <div v-else class="space-y-3">
              <button
                v-for="movie in paginatedHistory"
                :key="movie.slug"
                class="group flex w-full flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-border-default bg-bg-surface p-3 transition-all hover:border-accent-sky hover:bg-bg-elevated text-left shadow-sm"
                @click="handleMovieClick(movie)"
              >
                <div class="flex gap-4 items-center flex-1">
                  <img
                    :src="movie.thumb_url"
                    :alt="movie.name"
                    class="h-20 w-14 sm:h-24 sm:w-16 rounded object-cover shadow-sm transition-transform group-hover:scale-105 shrink-0"
                    loading="lazy"
                  />
                  <div class="flex-1 min-w-0">
                    <h3
                      class="font-display font-bold text-base text-text-primary transition-colors group-hover:text-accent-sky mb-1 line-clamp-2 sm:line-clamp-1"
                    >
                      {{ movie.name }}
                    </h3>
                    <div class="flex flex-wrap items-center gap-2 text-xs text-text-dim mb-2">
                      <span v-if="movie.quality" class="font-bold text-accent-amber">{{
                        movie.quality
                      }}</span>
                      <span v-if="movie.year">{{ movie.year }}</span>
                      <span v-if="movie.time" class="flex items-center gap-1"
                        ><Icon icon="ph:clock" class="h-3 w-3" /> {{ movie.time }}</span
                      >
                    </div>
                    <p
                      v-if="movie.episode_name"
                      class="text-sm text-accent-coral font-medium flex items-center gap-1.5 overflow-hidden"
                    >
                      <Icon icon="ph:play-circle-fill" class="h-4 w-4 shrink-0" />
                      <span class="truncate">Đang xem: {{ movie.episode_name }}</span>
                    </p>
                  </div>
                </div>

                <div
                  class="text-xs font-medium text-text-secondary flex items-center gap-1.5 sm:self-start bg-bg-deep px-3 py-1.5 rounded-lg border border-border-default shrink-0 ml-16 sm:ml-0"
                >
                  <Icon icon="ph:calendar-blank" class="h-4 w-4 text-accent-sky" />
                  {{ formatTimeAgo(movie.last_watched) }}
                </div>
              </button>
            </div>
            <div v-if="historyTotalPages > 1" class="mt-8 flex justify-center">
              <AppPagination
                :current-page="historyPage"
                :total-pages="historyTotalPages"
                @page-change="(p) => (historyPage = p)"
              />
            </div>
          </section>
        </div>

        <!-- Search Results Tab -->
        <div v-else-if="activeTab === 'search'" class="space-y-8 flex-1">
          <h2
            class="mb-6 flex items-center gap-3 font-display text-2xl font-semibold text-text-primary"
          >
            <div
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-coral/20 text-accent-coral"
            >
              <Icon icon="ph:magnifying-glass" class="h-5 w-5" />
            </div>
            Kết quả tìm kiếm: <span class="text-text-secondary">"{{ searchQuery }}"</span>
          </h2>
          <div
            v-if="movies.length === 0 && searchQuery"
            class="rounded-xl border border-dashed border-border-default p-12 text-center text-text-secondary flex flex-col items-center justify-center gap-3"
          >
            <Icon icon="ph:ghost" class="h-8 w-8 opacity-50" />
            <p>Không tìm thấy phim nào khớp với từ khóa của bạn.</p>
          </div>
          <div v-else class="space-y-8">
            <MovieList :movies="movies" @click="handleMovieClick" />
            <div class="mt-8 flex justify-center">
              <AppPagination
                :current-page="currentPage"
                :total-pages="totalPages"
                @page-change="fetchMovies"
              />
            </div>
          </div>
        </div>

        <!-- Dashboard Home Tab -->
        <div v-else-if="activeTab === 'home'" class="space-y-12 flex-1 pb-10">
          <!-- Phim Đề Cử -->
          <section v-if="homeDeCu.length > 0">
            <div class="mb-4 flex items-end justify-between">
              <h2
                class="font-display text-xl sm:text-2xl font-bold uppercase text-accent-amber flex items-center gap-2"
              >
                <Icon icon="ph:star-fill" class="h-6 w-6 text-accent-coral" />
                Phim Đề Cử
              </h2>
            </div>
            <MovieList
              :movies="homeDeCu"
              layout="row"
              :auto-scroll="true"
              @click="handleMovieClick"
            />
          </section>

          <!-- Phim Lẻ Mới -->
          <section v-if="homePhimLe.length > 0">
            <div class="mb-4 flex items-end justify-between border-b border-white/5 pb-2">
              <h2 class="font-display text-xl sm:text-2xl font-bold uppercase text-accent-amber">
                Phim Lẻ Mới Cập Nhật
              </h2>
              <button
                @click="activeTab = 'phim-le'"
                class="text-xs sm:text-sm font-semibold px-3 py-1 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-colors text-text-secondary hover:text-white"
              >
                Xem tất cả ▸
              </button>
            </div>
            <MovieList :movies="homePhimLe" layout="row" @click="handleMovieClick" />
          </section>

          <!-- Phim Bộ Mới -->
          <section v-if="homePhimBo.length > 0">
            <div class="mb-4 flex items-end justify-between border-b border-white/5 pb-2">
              <h2 class="font-display text-xl sm:text-2xl font-bold uppercase text-accent-amber">
                Phim Bộ Mới Cập Nhật
              </h2>
              <button
                @click="activeTab = 'phim-bo'"
                class="text-xs sm:text-sm font-semibold px-3 py-1 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-colors text-text-secondary hover:text-white"
              >
                Xem tất cả ▸
              </button>
            </div>
            <MovieList :movies="homePhimBo" layout="row" @click="handleMovieClick" />
          </section>

          <!-- Hoạt Hình Mới -->
          <section v-if="homeHoatHinh.length > 0">
            <div class="mb-4 flex items-end justify-between border-b border-white/5 pb-2">
              <h2 class="font-display text-xl sm:text-2xl font-bold uppercase text-accent-amber">
                Hoạt Hình Mới Cập Nhật
              </h2>
              <button
                @click="activeTab = 'hoat-hinh'"
                class="text-xs sm:text-sm font-semibold px-3 py-1 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-colors text-text-secondary hover:text-white"
              >
                Xem tất cả ▸
              </button>
            </div>
            <MovieList :movies="homeHoatHinh" layout="row" @click="handleMovieClick" />
          </section>
        </div>

        <!-- List Tabs (phim-le, phim-bo, etc.) -->
        <div v-else class="space-y-8 flex-1">
          <div class="mb-5 flex items-end justify-between border-b border-white/5 pb-4">
            <h2
              class="flex items-center gap-3 font-display text-2xl font-semibold text-text-primary"
            >
              <div
                class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-coral/10 text-accent-coral"
              >
                <Icon
                  :icon="tabs.find((t) => t.id === activeTab)?.icon || 'ph:film-strip'"
                  class="h-5 w-5"
                />
              </div>
              {{
                activeTab === 'genres'
                  ? `Tuyển tập: ${genresList.find((g) => g.slug === activeGenre)?.name}`
                  : tabs.find((t) => t.id === activeTab)?.name
              }}
            </h2>
            <div class="text-right">
              <p class="text-sm text-text-secondary hidden sm:block">
                Trang <span class="text-white font-medium">{{ currentPage }}</span> /
                {{ totalPages }}
              </p>
              <p v-if="activeTab !== 'genres'" class="text-xs text-text-dim hidden sm:block mt-1">
                Tổng: {{ totalItems }} phim
              </p>
            </div>
          </div>

          <MovieList :movies="movies" @click="handleMovieClick" />

          <div class="mt-12 flex justify-center pt-4">
            <AppPagination
              :current-page="currentPage"
              :total-pages="totalPages"
              @page-change="fetchMovies"
            />
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer
        class="mt-20 border-t border-white/5 pt-10 pb-12 text-center text-sm w-full transition-opacity opacity-70 hover:opacity-100"
      >
        <div class="flex flex-col items-center justify-center gap-2">
          <div class="h-1 w-10 rounded-full bg-accent-coral/50 mb-4"></div>
          <p class="font-display text-text-secondary">
            Created by
            <span
              class="bg-gradient-to-r from-accent-coral to-accent-amber bg-clip-text font-bold text-transparent text-base tracking-wide"
              >Nguyen Duc Kien</span
            >
          </p>
          <p class="text-text-dim text-xs tracking-wider uppercase mt-1">
            VibeCoding &mdash; J2TEAM Community
          </p>
        </div>
      </footer>
    </main>
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
