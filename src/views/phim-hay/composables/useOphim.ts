import { ref } from 'vue'
import type { OphimResponse } from '../types'
export function useOphim() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const BASE_URL = 'https://ophim1.com'
  const THUMB_BASE = 'https://img.ophim.live/uploads/movies/'

  const fetchApi = async (endpoint: string): Promise<OphimResponse | null> => {
    isLoading.value = true
    error.value = null
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.status === false || data.status === 'false') {
        throw new Error(data.msg || data.message || 'API Error')
      }
      return data
    } catch (e: unknown) {
      if (e instanceof Error) {
        error.value = e.message
      } else {
        error.value = String(e)
      }
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Get new movies list (for home)
  const getNewMovies = async (page = 1) => {
    return fetchApi(`/danh-sach/phim-moi-cap-nhat?page=${page}`)
  }

  // Search
  const searchMovies = async (keyword: string, page = 1) => {
    // Search API uses v1/api/tim-kiem structure
    return fetchApi(`/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&page=${page}`)
  }

  // Get list by type (phim-bo, phim-le, hoat-hinh, etc.)
  const getMoviesByList = async (slug: string, page = 1) => {
    return fetchApi(`/v1/api/danh-sach/${slug}?page=${page}`)
  }

  // Get list by genre (the-loai)
  const getMoviesByCategory = async (slug: string, page = 1) => {
    return fetchApi(`/v1/api/the-loai/${slug}?page=${page}`)
  }

  // Get movie details
  const getMovieDetail = async (slug: string) => {
    return fetchApi(`/phim/${slug}`)
  }

  return {
    isLoading,
    error,
    THUMB_BASE,
    getNewMovies,
    searchMovies,
    getMoviesByList,
    getMoviesByCategory,
    getMovieDetail,
  }
}
