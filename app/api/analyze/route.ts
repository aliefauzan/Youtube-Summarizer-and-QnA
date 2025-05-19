import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { extractVideoId, createFallbackVideoData } from "@/lib/youtube"
import { getCachedVideoData, getCachedAnalysis, cacheAnalysis, cacheVideoData } from "@/lib/cache-service"
import { fetchTranscript, formatTranscript } from "@/lib/transcript-service"
import type { OutputSettings } from "@/components/youtube/output-customization"

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// Function to fetch video data (similar to summarize route)
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
  feedback?: string,
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
        const languageInstructions = getLanguageInstructions(language)

        // Format instructions based on output settings
        const formatInstructions = getFormatInstructions(outputSettings, language)

        // Style instructions based on output settings
        const styleInstructions = getStyleInstructions(outputSettings, language)

        // References instructions
        const referencesInstructions = getReferencesInstructions(outputSettings, language)

        // Page length instructions
        const pageLengthInstructions = getPageLengthInstructions(outputSettings, language)

        // Feedback instructions
        const feedbackInstructions = feedback
          ? `USER FEEDBACK: ${feedback}\nPlease incorporate this feedback into your response.`
          : ""

        const prompt = `
${languageInstructions}

${formatInstructions}

${styleInstructions}

${pageLengthInstructions}

${referencesInstructions}

${feedbackInstructions}

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

// Helper function to get language instructions
function getLanguageInstructions(language: string): string {
  switch (language) {
    case "id":
      return "Jawab pertanyaan-pertanyaan berikut berdasarkan video-video tersebut dalam bahasa Indonesia."
    case "es":
      return "Responde las siguientes preguntas basándote en los videos en español."
    case "fr":
      return "Répondez aux questions suivantes en vous basant sur les vidéos en français."
    case "de":
      return "Beantworten Sie die folgenden Fragen basierend auf den Videos auf Deutsch."
    case "zh":
      return "根据视频用中文回答以下问题。"
    case "ja":
      return "ビデオに基づいて、以下の質問に日本語で答えてください。"
    case "ko":
      return "비디오를 기반으로 다음 질문에 한국어로 답하십시오."
    case "ar":
      return "أجب على الأسئلة التالية بناءً على مقاطع الفيديو باللغة العربية."
    case "hi":
      return "वीडियो के आधार पर निम्नलिखित प्रश्नों का उत्तर हिंदी में दें।"
    case "pt":
      return "Responda às seguintes perguntas com base nos vídeos em português."
    case "ru":
      return "Ответьте на следующие вопросы на основе видео на русском языке."
    case "en":
    default:
      return "Answer the following questions based on the videos in English."
  }
}

// Helper function to get format instructions based on settings
function getFormatInstructions(settings: OutputSettings, language: string): string {
  const formatMap: Record<string, Record<string, string>> = {
    en: {
      pdf: `Format the answer for a PDF document with ${settings.fontFamily} font, size ${settings.fontSize}, and ${settings.lineSpacing} line spacing.`,
      markdown: "Format the answer in Markdown with clear headings and subheadings.",
      docx: `Format the answer for a Word document with ${settings.fontFamily} font, size ${settings.fontSize}, and ${settings.lineSpacing} line spacing.`,
    },
    id: {
      pdf: `Format jawaban untuk dokumen PDF dengan font ${settings.fontFamily}, ukuran ${settings.fontSize}, dan spasi ${settings.lineSpacing}.`,
      markdown: "Format jawaban dalam Markdown dengan judul dan subjudul yang jelas.",
      docx: `Format jawaban untuk dokumen Word dengan font ${settings.fontFamily}, ukuran ${settings.fontSize}, dan spasi ${settings.lineSpacing}.`,
    },
  }

  // Default to English if language not found
  const langMap = formatMap[language] || formatMap.en
  return langMap[settings.format] || langMap.markdown
}

// Helper function to get style instructions based on settings
function getStyleInstructions(settings: OutputSettings, language: string): string {
  const styleMap: Record<string, Record<string, Record<string, string>>> = {
    en: {
      tone: {
        formal: "Use formal, academic language. ",
        informal: "Use clear, conversational language. ",
      },
      style: {
        concise: "Provide concise answers that get straight to the point. ",
        detailed: "Provide detailed and comprehensive answers. ",
        academic:
          "Provide answers in an academic style, including in-depth analysis and appropriate technical terminology. ",
      },
    },
    id: {
      tone: {
        formal: "Gunakan gaya bahasa formal dan akademis. ",
        informal: "Gunakan bahasa yang jelas dan percakapan. ",
      },
      style: {
        concise: "Berikan jawaban yang ringkas dan langsung ke inti permasalahan. ",
        detailed: "Berikan jawaban yang detail dan komprehensif. ",
        academic:
          "Berikan jawaban dengan gaya akademis, termasuk analisis mendalam dan terminologi teknis yang sesuai. ",
      },
    },
  }

  // Default to English if language not found
  const langMap = styleMap[language] || styleMap.en

  let styleInstructions = ""

  // Add tone instructions
  styleInstructions += settings.formalTone
    ? langMap.tone.formal || styleMap.en.tone.formal
    : langMap.tone.informal || styleMap.en.tone.informal

  // Add style instructions
  styleInstructions += langMap.style[settings.summaryStyle] || styleMap.en.style[settings.summaryStyle]

  return styleInstructions
}

// Helper function to get references instructions
function getReferencesInstructions(settings: OutputSettings, language: string): string {
  if (!settings.includeReferences) return ""

  return language === "id"
    ? "Sertakan daftar referensi di akhir dokumen, termasuk video yang dianalisis dan sumber tambahan jika ada."
    : "Include a list of references at the end of the document, including the analyzed videos and any additional sources if used."
}

// Helper function to get page length instructions
function getPageLengthInstructions(settings: OutputSettings, language: string): string {
  return language === "id"
    ? `Pastikan jawaban memiliki panjang yang sesuai untuk dokumen ${settings.minPages}-${settings.maxPages} halaman dengan font ${settings.fontFamily}, ukuran ${settings.fontSize}, dan spasi ${settings.lineSpacing}.`
    : `Ensure the answer is appropriate in length for a ${settings.minPages}-${settings.maxPages} page document with ${settings.fontFamily} font, size ${settings.fontSize}, and ${settings.lineSpacing} line spacing.`
}

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
          const videoData = await fetchVideoData(videoId, url, language)
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
    const analysis = await analyzeVideosWithGemini(successfulResults, questions, language, settings, feedback)

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
