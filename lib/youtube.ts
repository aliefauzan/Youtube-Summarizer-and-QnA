/**
 * Extracts the video ID from a YouTube URL
 */
export function extractVideoId(url: string): string | null {
  if (!url) return null

  // Handle different YouTube URL formats
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[7] && match[7].length === 11 ? match[7] : null
}

/**
 * Gets the thumbnail URL for a YouTube video
 */
export function getYouTubeThumbnail(videoId: string): string {
  // Use medium quality as fallback if maxresdefault is not available
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
}

/**
 * Creates a fallback video object when API fails
 */
export function createFallbackVideoData(videoId: string, url: string) {
  return {
    transcript: `Unable to fetch transcript for video ID: ${videoId}. Using fallback data.`,
    title: `YouTube Video (ID: ${videoId})`,
    channelTitle: "Unknown Channel",
    url: url || `https://www.youtube.com/watch?v=${videoId}`,
    fallback: true,
  }
}

/**
 * Formats view count with appropriate suffixes (K, M, B)
 */
export function formatViewCount(viewCount: number): string {
  if (!viewCount) return "Unknown views"

  if (viewCount >= 1000000000) {
    return `${(viewCount / 1000000000).toFixed(1)}B views`
  } else if (viewCount >= 1000000) {
    return `${(viewCount / 1000000).toFixed(1)}M views`
  } else if (viewCount >= 1000) {
    return `${(viewCount / 1000).toFixed(1)}K views`
  } else {
    return `${viewCount} views`
  }
}

/**
 * Formats duration from ISO 8601 format to human-readable format
 */
export function formatDuration(duration: string): string {
  if (!duration) return ""

  // ISO 8601 duration format: PT#H#M#S
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return ""

  const hours = match[1] ? `${match[1]}:` : ""
  const minutes = match[2] ? `${match[2]}:` : "0:"
  const seconds = match[3] ? match[3].padStart(2, "0") : "00"

  return `${hours}${minutes}${seconds}`
}
