import { ref, watch } from 'vue'
import type { HistoryItem } from '../types'

export function useHistory() {
  // Store lists in localStorage
  const watchHistory = ref<HistoryItem[]>([])
  const bookmarks = ref<HistoryItem[]>([])

  try {
    const sh = localStorage.getItem('phim-hay-history')
    if (sh) watchHistory.value = JSON.parse(sh)
    const sb = localStorage.getItem('phim-hay-bookmarks')
    if (sb) bookmarks.value = JSON.parse(sb)
  } catch (e) {
    console.error('Local storage parse error', e)
  }

  watch(
    watchHistory,
    (val) => {
      localStorage.setItem('phim-hay-history', JSON.stringify(val))
    },
    { deep: true },
  )

  watch(
    bookmarks,
    (val) => {
      localStorage.setItem('phim-hay-bookmarks', JSON.stringify(val))
    },
    { deep: true },
  )

  const addToHistory = (movie: HistoryItem) => {
    // Remove if already exists to put it at the top
    watchHistory.value = watchHistory.value.filter((item: HistoryItem) => item.slug !== movie.slug)
    watchHistory.value.unshift(movie)
    // Keep only last 50
    if (watchHistory.value.length > 50) {
      watchHistory.value.pop()
    }
  }

  const removeFromHistory = (slug: string) => {
    watchHistory.value = watchHistory.value.filter((item: HistoryItem) => item.slug !== slug)
  }

  const toggleBookmark = (movie: HistoryItem) => {
    const isBookmarked = bookmarks.value.some((item: HistoryItem) => item.slug === movie.slug)
    if (isBookmarked) {
      bookmarks.value = bookmarks.value.filter((item: HistoryItem) => item.slug !== movie.slug)
    } else {
      bookmarks.value.unshift(movie)
    }
  }

  const isBookmarked = (slug: string) => {
    return bookmarks.value.some((item: HistoryItem) => item.slug === slug)
  }

  return {
    watchHistory,
    bookmarks,
    addToHistory,
    removeFromHistory,
    toggleBookmark,
    isBookmarked,
  }
}
