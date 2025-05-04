import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { extractVideoId, createFallbackVideoData } from "@/lib/youtube"

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// Function to fetch video data (same as in summarize route)
async function fetchVideoData(
  videoId: string,
  originalUrl: string,
): Promise<{
  transcript: string
  title: string
  channelTitle: string
  url: string
  fallback?: boolean
}> {
  if (!process.env.YOUTUBE_API_KEY) {
    console.warn("YouTube API key is missing. Using fallback data.")
    return createFallbackVideoData(videoId, originalUrl)
  }

  try {
    // Fetch video details with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`,
      { signal: controller.signal },
    )

    clearTimeout(timeoutId)

    if (!videoResponse.ok) {
      const errorData = await videoResponse.json().catch(() => ({}))
      console.error("YouTube API error:", errorData)

      if (videoResponse.status === 403) {
        console.error("YouTube API key may be invalid or quota exceeded")
      }

      throw new Error(`YouTube API returned status ${videoResponse.status}`)
    }

    const videoData = await videoResponse.json()
    if (!videoData.items || videoData.items.length === 0) {
      console.warn(`Video not found: ${videoId}`)
      return createFallbackVideoData(videoId, originalUrl)
    }

    const videoTitle = videoData.items[0].snippet.title
    const channelTitle = videoData.items[0].snippet.channelTitle
    const description = videoData.items[0].snippet.description || "No description available."

    // In a real implementation, you would use a specialized library to get the transcript
    return {
      transcript: `Title: ${videoTitle}\n\nDescription: ${description}\n\n(This is a simulated transcript for demonstration purposes.)`,
      title: videoTitle,
      channelTitle: channelTitle,
      url: originalUrl || `https://www.youtube.com/watch?v=${videoId}`,
    }
  } catch (error) {
    console.error(`Error fetching data for video ${videoId}:`, error)
    return createFallbackVideoData(videoId, originalUrl)
  }
}

// Function to analyze videos and answer questions using Gemini API
async function analyzeVideosWithGemini(
  videoData: Array<{
    transcript: string
    title: string
    channelTitle: string
    url: string
  }>,
  questions: string,
  language: string,
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("Gemini API key is missing. Using fallback analyzer.")
    return "API key is missing. Please provide a valid Gemini API key."
  }

  try {
    // Prioritize gemini-2.0-flash-lite for efficiency
    const modelOptions = ["gemini-2.0-flash-lite", "gemini-1.5-pro", "gemini-1.0-pro", "gemini-pro"]
    let error = null

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

    // Try each model name until one works
    for (const modelName of modelOptions) {
      try {
        console.log(`Attempting to use Gemini model: ${modelName}`)
        const model = genAI.getGenerativeModel({ model: modelName })

        // Determine language for instructions
        const instructions =
          language === "id"
            ? "Jawab pertanyaan-pertanyaan berikut berdasarkan video-video tersebut. Berikan jawaban yang terstruktur dan komprehensif dalam bahasa Indonesia. Jika informasi tidak tersedia dalam video, nyatakan dengan jelas."
            : "Answer the following questions based on the videos. Provide structured and comprehensive answers. If information is not available in the videos, clearly state that."

        const prompt = `
${instructions}

${videoInfo}

QUESTIONS:
${questions}

Format your answers in Markdown, with clear headings for each question. Be thorough but concise.
`

        const result = await model.generateContent(prompt)
        const response = await result.response
        return response.text()
      } catch (e) {
        console.error(`Error with model ${modelName}:`, e)
        error = e
        // Continue to try the next model
      }
    }

    // If we get here, all models failed
    console.warn("All Gemini models failed.")
    return "Failed to analyze videos. All AI models encountered errors."
  } catch (error) {
    console.error("Error analyzing with Gemini:", error)
    return `Error: ${error instanceof Error ? error.message : "Unknown error"}`
  }
}

export async function POST(request: NextRequest) {
  try {
    const { urls, questions, language = "en" } = await request.json()

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "Please provide at least one valid YouTube URL" }, { status: 400 })
    }

    if (!questions || typeof questions !== "string") {
      return NextResponse.json({ error: "Please provide questions to analyze" }, { status: 400 })
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
          const videoData = await fetchVideoData(videoId, url)
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
    const analysis = await analyzeVideosWithGemini(successfulResults, questions, language)

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

    return NextResponse.json({
      analysis: finalResponse,
      videoCount: successfulResults.length,
      errorCount: errorResults.length,
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
