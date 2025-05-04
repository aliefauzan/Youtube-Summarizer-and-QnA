import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { extractVideoId, createFallbackVideoData } from "@/lib/youtube"
import type { OutputSettings } from "@/components/youtube/output-customization"

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// Function to fetch video data (same as before)
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
  outputSettings: OutputSettings,
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
        const languageInstructions =
          language === "id"
            ? "Jawab pertanyaan-pertanyaan berikut berdasarkan video-video tersebut dalam bahasa Indonesia."
            : "Answer the following questions based on the videos."

        // Format instructions based on output settings
        const formatInstructions = getFormatInstructions(outputSettings, language)

        // Style instructions based on output settings
        const styleInstructions = getStyleInstructions(outputSettings, language)

        // References instructions
        const referencesInstructions = outputSettings.includeReferences
          ? language === "id"
            ? "Sertakan daftar referensi di akhir dokumen, termasuk video yang dianalisis dan sumber tambahan jika ada."
            : "Include a list of references at the end of the document, including the analyzed videos and any additional sources if used."
          : ""

        // Page length instructions
        const pageLengthInstructions =
          language === "id"
            ? `Pastikan jawaban memiliki panjang yang sesuai untuk dokumen ${outputSettings.minPages}-${outputSettings.maxPages} halaman dengan font ${outputSettings.fontFamily}, ukuran ${outputSettings.fontSize}, dan spasi ${outputSettings.lineSpacing}.`
            : `Ensure the answer is appropriate in length for a ${outputSettings.minPages}-${outputSettings.maxPages} page document with ${outputSettings.fontFamily} font, size ${outputSettings.fontSize}, and ${outputSettings.lineSpacing} line spacing.`

        const prompt = `
${languageInstructions}

${formatInstructions}

${styleInstructions}

${pageLengthInstructions}

${referencesInstructions}

VIDEO CONTENT:
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

// Helper function to get format instructions based on settings
function getFormatInstructions(settings: OutputSettings, language: string): string {
  if (language === "id") {
    return settings.format === "pdf"
      ? `Format jawaban untuk dokumen PDF dengan font ${settings.fontFamily}, ukuran ${settings.fontSize}, dan spasi ${settings.lineSpacing}.`
      : "Format jawaban dalam Markdown dengan judul dan subjudul yang jelas."
  } else {
    return settings.format === "pdf"
      ? `Format the answer for a PDF document with ${settings.fontFamily} font, size ${settings.fontSize}, and ${settings.lineSpacing} line spacing.`
      : "Format the answer in Markdown with clear headings and subheadings."
  }
}

// Helper function to get style instructions based on settings
function getStyleInstructions(settings: OutputSettings, language: string): string {
  let styleInstructions = ""

  if (language === "id") {
    if (settings.formalTone) {
      styleInstructions += "Gunakan gaya bahasa formal dan akademis. "
    }

    if (settings.summaryStyle === "concise") {
      styleInstructions += "Berikan jawaban yang ringkas dan langsung ke inti permasalahan. "
    } else if (settings.summaryStyle === "detailed") {
      styleInstructions += "Berikan jawaban yang detail dan komprehensif. "
    } else if (settings.summaryStyle === "academic") {
      styleInstructions +=
        "Berikan jawaban dengan gaya akademis, termasuk analisis mendalam dan terminologi teknis yang sesuai. "
    }
  } else {
    if (settings.formalTone) {
      styleInstructions += "Use formal, academic language. "
    }

    if (settings.summaryStyle === "concise") {
      styleInstructions += "Provide concise answers that get straight to the point. "
    } else if (settings.summaryStyle === "detailed") {
      styleInstructions += "Provide detailed and comprehensive answers. "
    } else if (settings.summaryStyle === "academic") {
      styleInstructions +=
        "Provide answers in an academic style, including in-depth analysis and appropriate technical terminology. "
    }
  }

  return styleInstructions
}

export async function POST(request: NextRequest) {
  try {
    const { urls, questions, language = "en", outputSettings } = await request.json()

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
    const analysis = await analyzeVideosWithGemini(successfulResults, questions, language, settings)

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
