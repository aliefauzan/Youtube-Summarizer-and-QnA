import { YouTubeSummarizer } from "@/components/youtube/youtube-summarizer"

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">YouTube Video Summarizer</h1>
          <p className="text-gray-600">Enter YouTube video URLs to generate summaries without signing in</p>
        </header>
        <YouTubeSummarizer />
      </div>
    </main>
  )
}
