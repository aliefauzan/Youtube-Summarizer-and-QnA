// Types for cached data
export interface CachedVideoData {
  videoId: string
  title: string
  channelTitle: string
  description: string
  transcript: string
  thumbnailUrl: string
  publishedAt: string
  timestamp: number // When the cache was created
}

export interface CachedSummary {
  urls: string[]
  summary: string
  language: string
  outputSettings: any
  timestamp: number
}

export interface CachedAnalysis {
  urls: string[]
  questions: string
  analysis: string
  language: string
  outputSettings: any
  timestamp: number
}

// Cache expiration times (in milliseconds)
const CACHE_EXPIRY = {
  VIDEO_DATA: 7 * 24 * 60 * 60 * 1000, // 7 days
  SUMMARY: 24 * 60 * 60 * 1000, // 1 day
  ANALYSIS: 24 * 60 * 60 * 1000, // 1 day
}

// Cache keys
const CACHE_KEYS = {
  VIDEO_DATA: "youtube_video_data_",
  SUMMARY: "youtube_summary_",
  ANALYSIS: "youtube_analysis_",
}

/**
 * Generates a cache key for video data
 */
export function getVideoDataCacheKey(videoId: string): string {
  return `${CACHE_KEYS.VIDEO_DATA}${videoId}`
}

/**
 * Generates a cache key for summary
 */
export function getSummaryCacheKey(urls: string[], language: string): string {
  // Sort URLs to ensure consistent cache keys regardless of order
  const sortedUrls = [...urls].sort()
  return `${CACHE_KEYS.SUMMARY}${sortedUrls.join("_")}_${language}`
}

/**
 * Generates a cache key for analysis
 */
export function getAnalysisCacheKey(urls: string[], questions: string, language: string): string {
  // Sort URLs to ensure consistent cache keys regardless of order
  const sortedUrls = [...urls].sort()
  // Use a hash of the questions to keep the key length reasonable
  const questionsHash = hashString(questions)
  return `${CACHE_KEYS.ANALYSIS}${sortedUrls.join("_")}_${questionsHash}_${language}`
}

/**
 * Simple string hashing function
 */
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(16)
}

/**
 * Checks if a cached item is expired
 */
function isCacheExpired(timestamp: number, expiryTime: number): boolean {
  return Date.now() - timestamp > expiryTime
}

/**
 * Stores video data in cache
 */
export function cacheVideoData(videoData: CachedVideoData): void {
  try {
    const key = getVideoDataCacheKey(videoData.videoId)
    const data = {
      ...videoData,
      timestamp: Date.now(),
    }
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error("Error caching video data:", error)
  }
}

/**
 * Retrieves video data from cache
 */
export function getCachedVideoData(videoId: string): CachedVideoData | null {
  try {
    const key = getVideoDataCacheKey(videoId)
    const data = localStorage.getItem(key)

    if (!data) return null

    const parsedData = JSON.parse(data) as CachedVideoData

    // Check if cache is expired
    if (isCacheExpired(parsedData.timestamp, CACHE_EXPIRY.VIDEO_DATA)) {
      localStorage.removeItem(key)
      return null
    }

    return parsedData
  } catch (error) {
    console.error("Error retrieving cached video data:", error)
    return null
  }
}

/**
 * Stores summary in cache
 */
export function cacheSummary(urls: string[], summary: string, language: string, outputSettings: any): void {
  try {
    const key = getSummaryCacheKey(urls, language)
    const data: CachedSummary = {
      urls,
      summary,
      language,
      outputSettings,
      timestamp: Date.now(),
    }
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error("Error caching summary:", error)
  }
}

/**
 * Retrieves summary from cache
 */
export function getCachedSummary(urls: string[], language: string): CachedSummary | null {
  try {
    const key = getSummaryCacheKey(urls, language)
    const data = localStorage.getItem(key)

    if (!data) return null

    const parsedData = JSON.parse(data) as CachedSummary

    // Check if cache is expired
    if (isCacheExpired(parsedData.timestamp, CACHE_EXPIRY.SUMMARY)) {
      localStorage.removeItem(key)
      return null
    }

    return parsedData
  } catch (error) {
    console.error("Error retrieving cached summary:", error)
    return null
  }
}

/**
 * Stores analysis in cache
 */
export function cacheAnalysis(
  urls: string[],
  questions: string,
  analysis: string,
  language: string,
  outputSettings: any,
): void {
  try {
    const key = getAnalysisCacheKey(urls, questions, language)
    const data: CachedAnalysis = {
      urls,
      questions,
      analysis,
      language,
      outputSettings,
      timestamp: Date.now(),
    }
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error("Error caching analysis:", error)
  }
}

/**
 * Retrieves analysis from cache
 */
export function getCachedAnalysis(urls: string[], questions: string, language: string): CachedAnalysis | null {
  try {
    const key = getAnalysisCacheKey(urls, questions, language)
    const data = localStorage.getItem(key)

    if (!data) return null

    const parsedData = JSON.parse(data) as CachedAnalysis

    // Check if cache is expired
    if (isCacheExpired(parsedData.timestamp, CACHE_EXPIRY.ANALYSIS)) {
      localStorage.removeItem(key)
      return null
    }

    return parsedData
  } catch (error) {
    console.error("Error retrieving cached analysis:", error)
    return null
  }
}

/**
 * Clears all cached data
 */
export function clearCache(): void {
  try {
    // Get all keys
    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (
        key &&
        (key.startsWith(CACHE_KEYS.VIDEO_DATA) ||
          key.startsWith(CACHE_KEYS.SUMMARY) ||
          key.startsWith(CACHE_KEYS.ANALYSIS))
      ) {
        keys.push(key)
      }
    }

    // Remove all cache items
    keys.forEach((key) => localStorage.removeItem(key))

    console.log(`Cleared ${keys.length} cached items`)
  } catch (error) {
    console.error("Error clearing cache:", error)
  }
}

/**
 * Gets cache statistics
 */
export function getCacheStats(): {
  videoDataCount: number
  summaryCount: number
  analysisCount: number
  totalSize: string
} {
  try {
    let videoDataCount = 0
    let summaryCount = 0
    let analysisCount = 0
    let totalSize = 0

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue

      const value = localStorage.getItem(key) || ""
      totalSize += key.length + value.length

      if (key.startsWith(CACHE_KEYS.VIDEO_DATA)) {
        videoDataCount++
      } else if (key.startsWith(CACHE_KEYS.SUMMARY)) {
        summaryCount++
      } else if (key.startsWith(CACHE_KEYS.ANALYSIS)) {
        analysisCount++
      }
    }

    // Convert bytes to KB or MB
    const sizeInKB = totalSize / 1024
    const totalSizeFormatted = sizeInKB > 1024 ? `${(sizeInKB / 1024).toFixed(2)} MB` : `${sizeInKB.toFixed(2)} KB`

    return {
      videoDataCount,
      summaryCount,
      analysisCount,
      totalSize: totalSizeFormatted,
    }
  } catch (error) {
    console.error("Error getting cache stats:", error)
    return {
      videoDataCount: 0,
      summaryCount: 0,
      analysisCount: 0,
      totalSize: "0 KB",
    }
  }
}
