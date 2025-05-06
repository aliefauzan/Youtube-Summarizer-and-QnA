import { type NextRequest, NextResponse } from "next/server"
import { YoutubeTranscript } from "youtube-transcript"
import { getCachedVideoData, cacheVideoData } from "@/lib/cache-service"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const videoId = searchParams.get("videoId")
  const language = searchParams.get("language") || undefined

  if (!videoId) {
    return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
  }

  try {
    // Check if we have cached transcript data
    const cachedData = getCachedVideoData(videoId)
    if (cachedData && cachedData.transcript && cachedData.transcript.includes("Transcript:")) {
      // If we have a real transcript cached (not just description)
      return NextResponse.json({
        transcript: parseTranscriptFromText(cachedData.transcript),
        language: language || "en",
        isGenerated: true,
        fromCache: true,
      })
    }

    // Try to fetch transcript
    try {
      // Correctly handle language parameter
      let transcriptItems;
      
      if (language) {
        // First try to get transcript in the specified language
        try {
          const transcript = await YoutubeTranscript.getTranscript(videoId);
          const transcriptList = await YoutubeTranscript.listTranscripts(videoId);
          const languageTranscript = transcriptList.find(t => t.languageCode === language);
          
          if (languageTranscript) {
            transcriptItems = await languageTranscript.fetch();
          } else {
            // Fallback to default transcript
            transcriptItems = transcript;
          }
        } catch (e) {
          // Fallback to default method if the above fails
          transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
        }
      } else {
        // No language specified, use default
        transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
      }

      // Format the response
      const response = {
        transcript: transcriptItems.map((item) => ({
          text: item.text,
          offset: item.offset,
          duration: item.duration,
        })),
        language: language || "en",
        isGenerated: true,
      }

      // If we have cached video data, update it with the transcript
      if (cachedData) {
        const formattedTranscript = `Title: ${cachedData.title}\n\nDescription: ${cachedData.description}\n\nTranscript:\n\n${transcriptItems
          .map((item) => `[${formatTimestamp(item.offset)}] ${item.text}`)
          .join("\n")}`

        cacheVideoData({
          ...cachedData,
          transcript: formattedTranscript,
          timestamp: Date.now(),
        })
      }

      return NextResponse.json(response)
    } catch (transcriptError) {
      // Transcript is disabled or unavailable
      console.log(`Transcript unavailable for video ${videoId}: ${transcriptError.message}`)

      // Return an empty transcript array but with a 200 status
      return NextResponse.json({
        transcript: [],
        language: language || "en",
        isGenerated: false,
        transcriptDisabled: true,
      })
    }
  } catch (error) {
    console.error("Error in transcript API:", error);
  
  // Check for specific error types
  if (error.message?.includes("quota")) {
    return NextResponse.json(
      {
        error: "YouTube API quota exceeded",
        details: "The daily quota for YouTube API requests has been reached. Please try again tomorrow.",
        transcript: [], // Return empty transcript array
        transcriptDisabled: true,
      },
      { status: 200 }, // Return 200 even on error to avoid breaking the UI
    );
  }
  
  if (error.message?.includes("authenticate")) {
    return NextResponse.json(
      {
        error: "Authentication error",
        details: "The YouTube API key may be invalid or missing.",
        transcript: [], // Return empty transcript array
        transcriptDisabled: true,
      },
      { status: 200 }, // Return 200 even on error to avoid breaking the UI
    );
  }
  
  // Generic error response
  return NextResponse.json(
    {
      error: "Failed to fetch transcript",
      details: error instanceof Error ? error.message : "Unknown error",
      transcript: [], // Return empty transcript array
      transcriptDisabled: true,
    },
    { status: 200 }, // Return 200 even on error to avoid breaking the UI
  );
}

// Helper function to parse transcript items from cached text
function parseTranscriptFromText(text: string): { text: string; offset: number; duration: number }[] {
  const transcriptItems: { text: string; offset: number; duration: number }[] = []

  // Extract the transcript section
  const transcriptSection = text.split("Transcript:")[1]
  if (!transcriptSection) return transcriptItems

  // Parse each line with timestamp
  const lines = transcriptSection.trim().split("\n")
  let prevOffset = 0

  lines.forEach((line, index) => {
    const match = line.match(/\[(\d+):(\d+)\] (.+)/)
    if (match) {
      const minutes = Number.parseInt(match[1], 10)
      const seconds = Number.parseInt(match[2], 10)
      const offsetMs = (minutes * 60 + seconds) * 1000
      const text = match[3]

      // Calculate approximate duration (time until next item or default 5 seconds)
      const duration = index < lines.length - 1 ? 5000 : 5000

      transcriptItems.push({
        text,
        offset: offsetMs,
        duration,
      })

      prevOffset = offsetMs
    }
  })

  return transcriptItems
}

// Helper function to format timestamp
function formatTimestamp(offsetMs: number): string {
  const totalSeconds = Math.floor(offsetMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}
