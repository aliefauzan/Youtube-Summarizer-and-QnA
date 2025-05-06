import { type NextRequest, NextResponse } from "next/server"
import { formatDuration } from "@/lib/youtube"
import { getCachedVideoData, cacheVideoData } from "@/lib/cache-service"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const videoId = searchParams.get("videoId")
  const skipCache = searchParams.get("skipCache") === "true"

  if (!videoId) {
    return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
  }

  // Check cache first (unless skipCache is true)
  if (!skipCache) {
    const cachedData = getCachedVideoData(videoId)
    if (cachedData) {
      console.log(`Using cached data for video ${videoId}`)
      return NextResponse.json({
        title: cachedData.title,
        channelTitle: cachedData.channelTitle,
        description: cachedData.description,
        publishedAt: cachedData.publishedAt,
        thumbnailUrl: cachedData.thumbnailUrl,
        fromCache: true,
      })
    }
  }

  if (!process.env.YOUTUBE_API_KEY) {
    return NextResponse.json(
      {
        error: "YouTube API key is missing",
        title: `YouTube Video (ID: ${videoId})`,
        channelTitle: "Unknown Channel",
        fallback: true,
      },
      { status: 200 },
    )
  }

  try {
    // Fetch video details with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`,
      { signal: controller.signal },
    )

    clearTimeout(timeoutId)

    if (!videoResponse.ok) {
      const errorData = await videoResponse.json().catch(() => ({}))
      console.error("YouTube API error:", errorData)

      // Return fallback data instead of an error
      return NextResponse.json(
        {
          title: `YouTube Video (ID: ${videoId})`,
          channelTitle: "Unknown Channel",
          description: "Video information unavailable",
          publishedAt: new Date().toISOString(),
          fallback: true,
        },
        { status: 200 },
      )
    }

    const videoData = await videoResponse.json()

    if (!videoData.items || videoData.items.length === 0) {
      return NextResponse.json(
        {
          title: `YouTube Video (ID: ${videoId})`,
          channelTitle: "Unknown Channel",
          description: "Video not found",
          fallback: true,
        },
        { status: 200 },
      )
    }

    const video = videoData.items[0]
    const thumbnailUrl =
      video.snippet.thumbnails?.maxres?.url ||
      video.snippet.thumbnails?.high?.url ||
      video.snippet.thumbnails?.medium?.url ||
      video.snippet.thumbnails?.default?.url ||
      ""

    // Cache the video data
    cacheVideoData({
      videoId,
      title: video.snippet.title,
      channelTitle: video.snippet.channelTitle,
      description: video.snippet.description || "",
      transcript: `Title: ${video.snippet.title}\n\nDescription: ${video.snippet.description || "No description available."}\n\n(This is a simulated transcript for demonstration purposes.)`,
      thumbnailUrl,
      publishedAt: video.snippet.publishedAt,
      timestamp: Date.now(),
    })

    return NextResponse.json({
      title: video.snippet.title,
      channelTitle: video.snippet.channelTitle,
      description: video.snippet.description,
      publishedAt: video.snippet.publishedAt,
      viewCount: video.statistics?.viewCount ? Number.parseInt(video.statistics.viewCount, 10) : undefined,
      likeCount: video.statistics?.likeCount ? Number.parseInt(video.statistics.likeCount, 10) : undefined,
      duration: video.contentDetails?.duration ? formatDuration(video.contentDetails.duration) : undefined,
      thumbnails: video.snippet.thumbnails,
    })
  } catch (error) {
    console.error("Error fetching video info:", error)

    // Return fallback data instead of an error
    return NextResponse.json(
      {
        title: `YouTube Video (ID: ${videoId})`,
        channelTitle: "Unknown Channel",
        description: "Error fetching video information",
        fallback: true,
      },
      { status: 200 },
    )
  }
}
