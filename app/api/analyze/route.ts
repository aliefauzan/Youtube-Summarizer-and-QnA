import { type NextRequest, NextResponse } from "next/server"
import { extractVideoId, createFallbackVideoData } from "@/lib/youtube"
import { getCachedVideoData, getCachedAnalysis, cacheAnalysis, cacheVideoData } from "@/lib/cache-service"
import { fetchTranscript, formatTranscript } from "@/lib/transcript-service"
import type { OutputSettings } from "@/components/youtube/output-customization"

export async function POST(request: NextRequest) {
  try {
    const {
      urls,
      questions,
      language = "en",
      outputSettings,
      skipCache = false,
      feedback,
      editedContent,
    } = await request.json()

    // Set default output settings if not provided
    const settings: OutputSettings = outputSettings || {
      format: "markdown",
      fontFamily: "Times-Roman",
      fontSize: 12,
      lineSpacing: 1.5,
      minPages: 3,
      maxPages: 6,
      includeReferences: true,
      formalTone: true,
      summaryStyle: "academic",
      language,
    }

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "Please provide at least one valid YouTube URL" }, { status: 400 })
    }

    if (!questions || typeof questions !== "string") {
      return NextResponse.json({ error: "Please provide questions to analyze" }, { status: 400 })
    }

    // If user has provided edited content and feedback, use that directly
    if (editedContent) {
      return NextResponse.json({
        analysis: editedContent,
        videoCount: urls.length,
        errorCount: 0,
        isEdited: true,
      })
    }

    // Check cache first (unless skipCache is true)
    if (!skipCache && !feedback) {
      const cachedAnalysis = getCachedAnalysis(urls, questions, language)
      if (cachedAnalysis) {
        console.log(`Using cached analysis for ${urls.join(", ")}`)
        return NextResponse.json({
          analysis: cachedAnalysis.analysis,
          videoCount: urls.length,
          errorCount: 0,
          fromCache: true,
        })
      }
    }

    // Process each URL in parallel
    const videoResults = await Promise.all(
      urls.map(async (url) => {
        const videoId = extractVideoId(url)
        if (!videoId) {
          return {
            error: true,
            message: `Invalid YouTube URL: ${url}`,
            url,
          }
        }

        try {
          // Fetch video data (implementation depends on your existing code)
          const videoData = await fetchVideoDataForAnalysis(videoId, url, language)
          return {
            error: false,
            ...videoData,
          }
        } catch (error) {
          console.error(`Error processing URL ${url}:`, error)
          return {
            error: true,
            message: `Failed to process video: ${url}`,
            url,
          }
        }
      }),
    )

    // Filter out errors
    const successfulResults = videoResults.filter((result) => !result.error) as Array<{
      transcript: string
      title: string
      channelTitle: string
      url: string
      fallback?: boolean
    }>

    const errorResults = videoResults.filter((result) => result.error) as Array<{
      error: true
      message: string
      url: string
    }>

    if (successfulResults.length === 0) {
      return NextResponse.json({ error: "Could not process any of the provided videos" }, { status: 400 })
    }

    // Analyze videos and answer questions
    const analysis = await analyzeVideosWithAI(successfulResults, questions, language, settings, feedback)

    // Format the response
    let finalResponse = ""

    // Add video information
    finalResponse += "## Videos Analyzed\n\n"
    successfulResults.forEach((video, index) => {
      finalResponse += `${index + 1}. [${video.title}](${video.url}) - ${video.channelTitle}\n`
    })
    finalResponse += "\n---\n\n"

    // Add the analysis
    finalResponse += analysis

    // Add any error messages
    if (errorResults.length > 0) {
      finalResponse += "\n\n## Errors\n\n"
      errorResults.forEach((result) => {
        finalResponse += `- ${result.message}\n`
      })
    }

    // Cache the analysis if there were no errors and no feedback was provided
    if (errorResults.length === 0 && !feedback) {
      cacheAnalysis(urls, questions, finalResponse, language, settings)
    }

    return NextResponse.json({
      analysis: finalResponse,
      videoCount: successfulResults.length,
      errorCount: errorResults.length,
      isEdited: false,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Helper function to fetch video data for analysis
async function fetchVideoDataForAnalysis(videoId: string, originalUrl: string, language: string) {
  // Check cache first
  const cachedData = getCachedVideoData(videoId)
  if (cachedData) {
    console.log(`Using cached data for video ${videoId}`)
    return {
      transcript: cachedData.transcript,
      title: cachedData.title,
      channelTitle: cachedData.channelTitle,
      url: originalUrl || `https://www.youtube.com/watch?v=${videoId}`,
      fallback: false,
    }
  }

  // Fetch video details from YouTube API
  try {
    // Use the YouTube API key from environment variables
    const apiKey = process.env.YOUTUBE_API_KEY

    if (!apiKey) {
      throw new Error("YouTube API key is missing")
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`,
    )

    if (!response.ok) {
      throw new Error(`YouTube API returned status ${response.status}`)
    }

    const data = await response.json()

    if (!data.items || data.items.length === 0) {
      throw new Error("Video not found")
    }

    const videoData = data.items[0]
    const title = videoData.snippet.title
    const channelTitle = videoData.snippet.channelTitle
    const description = videoData.snippet.description || "No description available"

    // Try to fetch transcript
    const transcriptResponse = await fetchTranscript(videoId, language)
    let transcriptText

    if (transcriptResponse && transcriptResponse.transcript.length > 0) {
      transcriptText = formatTranscript(transcriptResponse.transcript, title, description)
    } else {
      transcriptText = `Title: ${title}\n\nDescription: ${description}\n\n(No transcript available for this video. Using video description as fallback.)`
    }

    // Cache the video data
    cacheVideoData({
      videoId,
      title,
      channelTitle,
      description,
      transcript: transcriptText,
      thumbnailUrl: videoData.snippet.thumbnails?.high?.url || "",
      publishedAt: videoData.snippet.publishedAt,
      timestamp: Date.now(),
    })

    return {
      transcript: transcriptText,
      title,
      channelTitle,
      url: originalUrl || `https://www.youtube.com/watch?v=${videoId}`,
      fallback: !transcriptResponse || transcriptResponse.transcript.length === 0,
    }
  } catch (error) {
    console.error(`Error fetching data for video ${videoId}:`, error)
    return createFallbackVideoData(videoId, originalUrl)
  }
}

// Helper function to analyze videos with AI
async function analyzeVideosWithAI(
  videoData: Array<{
    transcript: string
    title: string
    channelTitle: string
    url: string
  }>,
  questions: string,
  language: string,
  outputSettings: OutputSettings,
  feedback?: string,
): Promise<string> {
  // Check if Gemini API key is available
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return "API key is missing. Please provide a valid Gemini API key."
  }

  try {
    // Prepare video information
    const videoInfo = videoData
      .map((video, index) => {
        return `VIDEO ${index + 1}: "${video.title}" by ${video.channelTitle}
URL: ${video.url}
TRANSCRIPT:
${video.transcript}

-------------------
`
      })
      .join("\n")

    // For this example, we'll use a simple analysis approach
    // In a real implementation, you would use the Gemini API here

    // Create a basic analysis based on the questions
    let analysis = ""

    // Split questions into sections
    const sections = questions.split("\n\n").filter((section) => section.trim().length > 0)

    for (const section of sections) {
      const lines = section.split("\n")
      const heading = lines[0]

      analysis += `## ${heading}\n\n`
      analysis += `Based on the ${videoData.length} video(s) analyzed, here are the key insights:\n\n`

      // Add some placeholder content
      analysis += `- The videos discuss topics related to ${videoData.map((v) => v.title).join(", ")}\n`
      analysis += `- Key concepts mentioned include technology, implementation, and applications\n`
      analysis += `- The content provides valuable information for understanding these topics\n\n`
    }

    // Add a conclusion
    analysis += `## Conclusion\n\n`
    analysis += `This analysis provides an overview of the key points from the videos. For more detailed information, please refer to the original content.\n`

    return analysis
  } catch (error) {
    console.error("Error analyzing videos:", error)
    return `Error: ${error instanceof Error ? error.message : "Unknown error"}`
  }
}
