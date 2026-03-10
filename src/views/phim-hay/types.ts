// OPhim API Types

export interface OphimResponse {
  status: boolean | string
  msg?: string
  message?: string
  data?: {
    items: MovieItem[]
    params?: {
      pagination?: { totalPages: number; totalItems?: number; totalItemsPerPage?: number }
    }
  }
  items?: MovieItem[]
  movie?: MovieDetail
  episodes?: Episode[]
  pathImage?: string
  pagination?: {
    totalItems: number
    totalItemsPerPage: number
    currentPage: number
    totalPages: number
  }
}

export interface MovieItem {
  _id: string
  name: string
  slug: string
  origin_name: string
  type: string
  thumb_url: string
  poster_url: string
  year: number | string
  time?: string
  episode_current?: string
  quality?: string
  lang?: string
  modified?: { time: string }
  tmdb?: { type: string; id: string; season: number; vote_average: number; vote_count: number }
}

export interface MovieDetail extends MovieItem {
  content: string
  status: string
  is_copyright: boolean
  sub_docquyen: boolean
  chieu_rap: boolean
  trailer_url: string
  episode_total: string
  actor: string[]
  director: string[]
  category: { id: string; name: string; slug: string }[]
  country: { id: string; name: string; slug: string }[]
}

export interface EpisodeData {
  name: string
  slug: string
  filename: string
  link_embed: string
  link_m3u8: string
}

export interface Episode {
  server_name: string
  server_data: EpisodeData[]
}

export interface HistoryItem {
  slug: string
  name: string
  thumb_url: string
  last_watched: number // timestamp
  episode_name?: string
  episode_current?: string
  time?: string
  quality?: string
  year?: number | string
  categories?: string[]
}
