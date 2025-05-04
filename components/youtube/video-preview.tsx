import Image from "next/image"
import { getYouTubeThumbnail } from "@/lib/youtube"
import { User, Eye, AlertTriangle } from "lucide-react"

interface VideoPreviewProps {
  videoId: string
  title: string
  channelTitle: string
  viewCount?: number
  duration?: string
  isLoading?: boolean
  isFallback?: boolean
}

export function VideoPreview({
  videoId,
  title,
  channelTitle,
  viewCount,
  duration,
  isLoading = false,
  isFallback = false,
}: VideoPreviewProps) {
  return (
    <div className={`rounded-lg overflow-hidden bg-white shadow ${isLoading ? "opacity-60" : ""}`}>
      <div className="flex">
        {/* Smaller thumbnail */}
        <div className="relative w-24 h-16 sm:w-32 sm:h-20">
          <Image
            src={getYouTubeThumbnail(videoId) || "/placeholder.svg"}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 96px, 128px"
          />
          {duration && (
            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 py-0.5 rounded">
              {duration}
            </div>
          )}
        </div>

        {/* Video info */}
        <div className="p-2 flex-1 min-w-0">
          <h3 className="font-medium text-xs sm:text-sm line-clamp-2">{title}</h3>
          <div className="flex items-center mt-1 text-xs text-gray-600">
            <User className="h-3 w-3 mr-1" />
            <span className="line-clamp-1 text-[10px] sm:text-xs">{channelTitle}</span>
          </div>
          {viewCount && (
            <div className="flex items-center mt-0.5 text-xs text-gray-600">
              <Eye className="h-3 w-3 mr-1" />
              <span className="text-[10px] sm:text-xs">{viewCount.toLocaleString()} views</span>
            </div>
          )}
        </div>

        {/* Fallback indicator */}
        {isFallback && (
          <div className="absolute top-1 right-1 bg-yellow-500 text-white text-[10px] px-1 py-0.5 rounded flex items-center gap-0.5">
            <AlertTriangle className="h-2 w-2" />
            <span className="text-[8px]">Limited Data</span>
          </div>
        )}
      </div>
    </div>
  )
}
