import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { extractVideoId, createFallbackVideoData } from "@/lib/youtube"
import { generateBasicSummary } from "@/lib/fallback-summarizer"
import { areRelated, mergeSummaries } from "@/lib/content-analyzer"
import { getCachedVideoData, getCachedSummary, cacheSummary, cacheVideoData } from "@/lib/cache-service"
import { fetchTranscript, formatTranscript } from "@/lib/transcript-service"
import type { OutputSettings } from "@/components/youtube/output-customization"

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// Function to fetch video transcript and metadata
async function fetchVideoData(
  videoId: string,
  originalUrl: string,
  language: string,
): Promise<{
  transcript: string
  title: string
  channelTitle: string
  url: string
  fallback?: boolean
}> {
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
    const thumbnailUrl =
      videoData.items[0].snippet.thumbnails?.maxres?.url ||
      videoData.items[0].snippet.thumbnails?.high?.url ||
      videoData.items[0].snippet.thumbnails?.medium?.url ||
      videoData.items[0].snippet.thumbnails?.default?.url ||
      ""
    const publishedAt = videoData.items[0].snippet.publishedAt

    // Try to fetch transcript
    const transcriptResponse = await fetchTranscript(videoId, language)
    let transcriptText: string

    if (transcriptResponse && transcriptResponse.transcript.length > 0) {
      // We have a transcript
      transcriptText = formatTranscript(transcriptResponse.transcript, videoTitle, description)

      // Cache the video data with transcript
      cacheVideoData({
        videoId,
        title: videoTitle,
        channelTitle,
        description,
        transcript: transcriptText,
        thumbnailUrl,
        publishedAt,
        timestamp: Date.now(),
      })
    } else {
      // No transcript available or transcript is disabled, use description as fallback
      transcriptText = `Title: ${videoTitle}\n\nDescription: ${description}\n\n(No transcript available for this video. Using video description as fallback.)`

      // Cache the video data without transcript
      cacheVideoData({
        videoId,
        title: videoTitle,
        channelTitle,
        description,
        transcript: transcriptText,
        thumbnailUrl,
        publishedAt,
        timestamp: Date.now(),
      })
    }

    return {
      transcript: transcriptText,
      title: videoTitle,
      channelTitle: channelTitle,
      url: originalUrl || `https://www.youtube.com/watch?v=${videoId}`,
      fallback: !transcriptResponse || transcriptResponse.transcript.length === 0,
    }
  } catch (error) {
    console.error(`Error fetching data for video ${videoId}:`, error)
    return createFallbackVideoData(videoId, originalUrl)
  }
}

// Function to summarize text using Gemini API
async function summarizeWithGemini(
  text: string,
  videoTitle: string,
  language: string,
  outputSettings: OutputSettings,
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("Gemini API key is missing. Using fallback summarizer.")
    return generateBasicSummary(text, videoTitle)
  }

  try {
    // Prioritize gemini-2.0-flash-lite for efficiency
    const modelOptions = ["gemini-2.0-flash-lite", "gemini-1.5-pro", "gemini-1.0-pro", "gemini-pro"]
    let error = null

    // Try each model name until one works
    for (const modelName of modelOptions) {
      try {
        console.log(`Attempting to use Gemini model: ${modelName}`)
        const model = genAI.getGenerativeModel({ model: modelName })

        // Determine language for instructions
        const languageInstructions = getLanguageInstructions(language)

        const prompt = `
        ${languageInstructions}
        
        Please summarize the following YouTube video content in a clear, concise manner.
        The video title is: "${videoTitle}"
        
        Format the summary in Markdown with:
        
        1. A brief overview of the main topic (1-2 sentences)
        2. 3-5 key points with bullet points
        3. A short conclusion or main takeaway
        
        If the content seems incomplete or is just metadata, please note that in your summary
        and do your best with the available information.
        
        Here is the content:
        
        ${text}
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

    // If we get here, all models failed - use fallback summarizer
    console.warn("All Gemini models failed. Using fallback summarizer.")
    return generateBasicSummary(text, videoTitle)
  } catch (error) {
    console.error("Error summarizing with Gemini:", error)

    // Use fallback summarizer when Gemini API fails
    console.warn("Using fallback summarizer due to Gemini API error.")
    return generateBasicSummary(text, videoTitle)
  }
}

// Helper function to get language instructions
function getLanguageInstructions(language: string): string {
  switch (language) {
    case "id":
      return "Buatlah ringkasan dalam bahasa Indonesia."
    case "es":
      return "Crea un resumen en español."
    case "fr":
      return "Créez un résumé en français."
    case "de":
      return "Erstellen Sie eine Zusammenfassung auf Deutsch."
    case "zh":
      return "用中文创建摘要。"
    case "ja":
      return "日本語で要約を作成してください。"
    case "ko":
      return "한국어로 요약을 작성하세요."
    case "ar":
      return "قم بإنشاء ملخص باللغة العربية."
    case "hi":
      return "हिंदी में एक सारांश बनाएं।"
    case "pt":
      return "Crie um resumo em português."
    case "ru":
      return "Создайте резюме на русском языке."
    case "en":
    default:
      return "Create a summary in English."
  }
}

export async function POST(request: NextRequest) {
  try {
    const { urls, language = "en", outputSettings, skipCache = false, feedback, editedContent } = await request.json()

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "Please provide at least one valid YouTube URL" }, { status: 400 })
    }

    // If user has provided edited content and feedback, use that directly
    if (editedContent) {
      return NextResponse.json({
        summary: editedContent,
        videoCount: urls.length,
        errorCount: 0,
        isEdited: true,
      })
    }

    // Check cache first (unless skipCache is true)
    if (!skipCache && !feedback) {
      const cachedSummary = getCachedSummary(urls, language)
      if (cachedSummary) {
        console.log(`Using cached summary for ${urls.join(", ")}`)
        return NextResponse.json({
          summary: cachedSummary.summary,
          areVideosRelated: true, // Assume related for cached summaries
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
            message: `⚠️ Invalid YouTube URL: ${url}\n\nCould not extract a valid YouTube video ID from this URL.`,
            url,
          }
        }

        try {
          const {
            transcript,
            title,
            channelTitle,
            url: videoUrl,
            fallback,
          } = await fetchVideoData(videoId, url, language)
          const summary = await summarizeWithGemini(transcript, title, language, outputSettings)

          return {
            error: false,
            videoId,
            title,
            channelTitle,
            url: videoUrl,
            summary,
            fallback,
          }
        } catch (error) {
          console.error(`Error processing URL ${url}:`, error)
          return {
            error: true,
            message: `⚠️ Failed to summarize video: ${url}\n\nError: ${error instanceof Error ? error.message : "Unknown error"}`,
            url,
          }
        }
      }),
    )

    // Filter out errors
    const successfulResults = videoResults.filter((result) => !result.error) as Array<{
      videoId: string
      title: string
      channelTitle: string
      url: string
      summary: string
      fallback?: boolean
    }>

    const errorResults = videoResults.filter((result) => result.error) as Array<{
      error: true
      message: string
      url: string
    }>

    // Check if we have multiple successful summaries to analyze for relevance
    let finalSummary = ""
    let areVideosRelated = false

    if (successfulResults.length > 1) {
      // Extract just the summaries for content analysis
      const summaries = successfulResults.map((result) => result.summary)
      const titles = successfulResults.map((result) => result.title)

      // Check if the summaries are related
      areVideosRelated = areRelated(summaries)

      if (areVideosRelated) {
        // Merge the related summaries
        const mergedSummary = mergeSummaries(summaries, titles)
        finalSummary = mergedSummary
      } else {
        // If not related, keep individual summaries
        successfulResults.forEach((result) => {
          const { title, channelTitle, url, summary, fallback } = result

          if (fallback) {
            finalSummary += `## Summary for [${title}](${url})\n\n⚠️ *Limited data available: Could not fetch complete video information*\n\n${summary}\n\n---\n\n`
          } else {
            finalSummary += `## Summary for [${title}](${url})\n\n*Channel: ${channelTitle}*\n\n${summary}\n\n---\n\n`
          }
        })
      }
    } else if (successfulResults.length === 1) {
      // Just one successful result
      const { title, channelTitle, url, summary, fallback } = successfulResults[0]

      if (fallback) {
        finalSummary = `## Summary for [${title}](${url})\n\n⚠️ *Limited data available: Could not fetch complete video information*\n\n${summary}\n\n`
      } else {
        finalSummary = `## Summary for [${title}](${url})\n\n*Channel: ${channelTitle}*\n\n${summary}\n\n`
      }
    }

    // Add any error messagesges
    if (errorResults.length > 0) {
      finalSummary += `\n## Errors\n\n`
      errorResults.forEach((result) => {
        finalSummary += `${result.message}\n\n`
      })
    }

    // Cache the summary if there were no errors and no feedback was provided
    if (errorResults.length === 0 && !feedback) {
      cacheSummary(urls, finalSummary, language, outputSettings)
    }

    return NextResponse.json({
      summary: finalSummary,
      areVideosRelated,
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
