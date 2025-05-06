"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Trash2, AlertTriangle } from "lucide-react"
import { VideoPreview } from "./video-preview"
import { TranscriptInfo } from "./transcript-info"
import { extractVideoId } from "@/lib/youtube"
import { fetchTranscript } from "@/lib/transcript-service"

interface UrlInputProps {
  value: string
  onChange: (value: string) => void
  onRemove: () => void
  disabled?: boolean
  showRemoveButton?: boolean
  language?: string
  onTranscriptLanguageChange?: (videoId: string, language: string) => void
}

export function UrlInput({
  value,
  onChange,
  onRemove,
  disabled = false,
  showRemoveButton = true,
  language = "en",
  onTranscriptLanguageChange,
}: UrlInputProps) {
  const [videoData, setVideoData] = useState<{
    videoId: string
    title: string
    channelTitle: string
    viewCount?: number
    duration?: string
    fallback?: boolean
    hasTranscript?: boolean
    transcriptDisabled?: boolean
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVideoData = async () => {
      const videoId = extractVideoId(value)
      if (!videoId) {
        setVideoData(null)
        setError(null)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/youtube/video-info?videoId=${videoId}`)
        const data = await response.json()

        if (data.error && !data.fallback) {
          setError(data.error)
          setVideoData(null)
        } else {
          // Check if transcript is available
          const transcriptResponse = await fetchTranscript(videoId, language)
          const hasTranscript = !!transcriptResponse && transcriptResponse.transcript.length > 0
          const transcriptDisabled = !!transcriptResponse && transcriptResponse.transcriptDisabled

          setVideoData({
            videoId,
            title: data.title || `YouTube Video (ID: ${videoId})`,
            channelTitle: data.channelTitle || "Unknown Channel",
            viewCount: data.viewCount,
            duration: data.duration,
            fallback: data.fallback,
            hasTranscript,
            transcriptDisabled,
          })
          setError(null)
        }
      } catch (error) {
        console.error("Error fetching video data:", error)
        setError("Failed to fetch video information")
        setVideoData({
          videoId,
          title: `YouTube Video (ID: ${videoId})`,
          channelTitle: "Unknown Channel",
          fallback: true,
          hasTranscript: false,
          transcriptDisabled: true,
        })
      } finally {
        setIsLoading(false)
      }
    }

    // Only fetch if we have a valid-looking URL
    if (value.includes("youtube.com/") || value.includes("youtu.be/")) {
      fetchVideoData()
    } else {
      setVideoData(null)
      setError(null)
    }
  }, [value, language])

  const handleTranscriptLanguageChange = (lang: string) => {
    if (videoData && onTranscriptLanguageChange) {
      onTranscriptLanguageChange(videoData.videoId, lang)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=...)"
          className="flex-1"
          disabled={disabled}
        />
        {showRemoveButton && (
          <Button variant="outline" size="icon" onClick={onRemove} disabled={disabled} aria-label="Remove URL">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-500 flex items-center gap-1">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {videoData && (
        <div className="space-y-2">
          <VideoPreview
            videoId={videoData.videoId}
            title={videoData.title}
            channelTitle={videoData.channelTitle}
            viewCount={videoData.viewCount}
            duration={videoData.duration}
            isLoading={isLoading}
            isFallback={videoData.fallback}
          />

          <div className="flex justify-end">
            <TranscriptInfo
              videoId={videoData.videoId}
              hasTranscript={!!videoData.hasTranscript}
              transcriptDisabled={!!videoData.transcriptDisabled}
              onLanguageChange={handleTranscriptLanguageChange}
            />
          </div>
        </div>
      )}
    </div>
  )
}
