import type { CachedVideoData } from "@/lib/cache-service"

// Types for transcript data
export interface TranscriptItem {
  text: string
  offset: number
  duration: number
}

export interface TranscriptResponse {
  transcript: TranscriptItem[]
  language: string
  isGenerated: boolean
  transcriptDisabled?: boolean
}

/**
 * Fetches transcript for a YouTube video
 * Uses the server-side API route to avoid CORS issues
 */
export async function fetchTranscript(videoId: string, language?: string): Promise<TranscriptResponse | null> {
  try {
    const url = `/api/youtube/transcript?videoId=${videoId}${language ? `&language=${language}` : ""}`
    const response = await fetch(url)

    if (!response.ok) {
      console.error("Transcript API returned non-200 status:", response.status)
      return null
    }

    const data = await response.json()

    // If transcript is disabled, return the response with empty transcript
    if (data.transcriptDisabled) {
      return {
        transcript: [],
        language: language || "en",
        isGenerated: false,
        transcriptDisabled: true,
      }
    }

    // If there's an error but we got a 200 response, return null
    if (data.error) {
      console.error("Transcript API error:", data.error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error fetching transcript:", error)
    return null
  }
}

/**
 * Formats transcript items into a single string
 */
export function formatTranscript(transcript: TranscriptItem[], title: string, description: string): string {
  // If transcript is empty, return just the title and description
  if (!transcript || transcript.length === 0) {
    return `Title: ${title}\n\nDescription: ${description}\n\n(No transcript available for this video. Using video description as fallback.)`
  }

  // Format timestamp as MM:SS
  const formatTimestamp = (offsetMs: number): string => {
    const totalSeconds = Math.floor(offsetMs / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  // Start with title and description
  let formattedTranscript = `Title: ${title}\n\nDescription: ${description}\n\nTranscript:\n\n`

  // Add each transcript item with timestamp
  transcript.forEach((item) => {
    formattedTranscript += `[${formatTimestamp(item.offset)}] ${item.text}\n`
  })

  return formattedTranscript
}

/**
 * Creates a fallback transcript from video metadata
 */
export function createFallbackTranscript(videoData: CachedVideoData): string {
  return `Title: ${videoData.title}\n\nDescription: ${videoData.description}\n\n(No transcript available for this video. Using video description as fallback.)`
}

/**
 * Gets available transcript languages for a video
 */
export async function getAvailableTranscriptLanguages(videoId: string): Promise<{ code: string; name: string }[]> {
  try {
    const response = await fetch(`/api/youtube/transcript/languages?videoId=${videoId}`)

    if (!response.ok) {
      console.error("Error fetching transcript languages")
      return []
    }

    const data = await response.json()

    // If transcript is disabled, return empty array
    if (data.transcriptDisabled) {
      return []
    }

    return data.languages || []
  } catch (error) {
    console.error("Error fetching transcript languages:", error)
    return []
  }
}
// Remove any direct access to process.env in this client-side file
// Instead, make API calls to server endpoints that can access environment variables
