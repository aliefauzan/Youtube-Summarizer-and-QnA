import { type NextRequest, NextResponse } from "next/server"
import { YoutubeTranscript } from "youtube-transcript"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const videoId = searchParams.get("videoId")

  if (!videoId) {
    return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
  }

  try {
    // Fetch available languages
    try {
      const languages = await YoutubeTranscript.listTranscripts(videoId)

      // Format the response
      const formattedLanguages = languages.map((lang) => ({
        code: lang.languageCode,
        name: getLanguageName(lang.languageCode),
      }))

      return NextResponse.json({ languages: formattedLanguages })
    } catch (transcriptError) {
      // Transcript is disabled or unavailable
      console.log(`Transcript languages unavailable for video ${videoId}: ${transcriptError.message}`)

      // Return empty languages array but with a 200 status
      return NextResponse.json({
        languages: [],
        transcriptDisabled: true,
      })
    }
  } catch (error) {
    console.error("Error fetching transcript languages:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch transcript languages",
        details: error instanceof Error ? error.message : "Unknown error",
        languages: [],
      },
      { status: 200 }, // Return 200 even on error to avoid breaking the UI
    )
  }
}

// Helper function to get language name from code
function getLanguageName(code: string): string {
  const languageMap: Record<string, string> = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    it: "Italian",
    pt: "Portuguese",
    ru: "Russian",
    ja: "Japanese",
    ko: "Korean",
    zh: "Chinese",
    ar: "Arabic",
    hi: "Hindi",
    id: "Indonesian",
    // Add more languages as needed
  }

  return languageMap[code] || code
}
