"use client"

import { useState } from "react"
import { PlusCircle, Copy, Loader2, AlertTriangle, Link2, FileText, FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ReactMarkdown from "react-markdown"
import { UrlInput } from "@/components/youtube/url-input"
import { QuestionInput } from "@/components/youtube/question-input"
import { ModelInfo } from "@/components/youtube/model-info"
import { extractVideoId } from "@/lib/youtube"

export function YouTubeSummarizer() {
  const [urls, setUrls] = useState<string[]>([""])
  const [summary, setSummary] = useState<string>("")
  const [analysis, setAnalysis] = useState<string>("")
  const [questions, setQuestions] = useState<string>("")
  const [language, setLanguage] = useState<string>("en")
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("summarize")
  const [summaryInfo, setSummaryInfo] = useState<{
    areVideosRelated: boolean
    videoCount: number
    errorCount: number
  } | null>(null)

  const { toast } = useToast()

  const addUrlField = () => {
    setUrls([...urls, ""])
  }

  const removeUrlField = (index: number) => {
    const newUrls = [...urls]
    newUrls.splice(index, 1)
    setUrls(newUrls.length ? newUrls : [""])
  }

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...urls]
    newUrls[index] = value
    setUrls(newUrls)
  }

  const handleSummarize = async () => {
    // Validate URLs
    const validUrls = urls.filter((url) => {
      const videoId = extractVideoId(url.trim())
      return videoId !== null
    })

    if (validUrls.length === 0) {
      setError("Please enter at least one valid YouTube URL")
      return
    }

    setLoading(true)
    setError("")
    setSummary("")
    setSummaryInfo(null)

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ urls: validUrls }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to summarize videos")
      }

      setSummary(data.summary)
      setSummaryInfo({
        areVideosRelated: data.areVideosRelated,
        videoCount: data.videoCount,
        errorCount: data.errorCount,
      })

      // Check if there were any errors
      if (data.errorCount > 0) {
        toast({
          title: "Warning",
          description: `${data.errorCount} video(s) could not be summarized. Check the results for details.`,
          variant: "destructive",
          duration: 5000,
        })
      }

      // Notify about related content
      if (data.areVideosRelated && data.videoCount > 1) {
        toast({
          title: "Related Content Detected",
          description: `The ${data.videoCount} videos appear to be related. A combined summary has been created.`,
          duration: 5000,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to summarize videos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = async () => {
    // Validate URLs
    const validUrls = urls.filter((url) => {
      const videoId = extractVideoId(url.trim())
      return videoId !== null
    })

    if (validUrls.length === 0) {
      setError("Please enter at least one valid YouTube URL")
      return
    }

    if (!questions.trim()) {
      setError("Please enter at least one question to analyze")
      return
    }

    setLoading(true)
    setError("")
    setAnalysis("")

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          urls: validUrls,
          questions,
          language,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to analyze videos")
      }

      setAnalysis(data.analysis)

      // Check if there were any errors
      if (data.errorCount > 0) {
        toast({
          title: "Warning",
          description: `${data.errorCount} video(s) could not be analyzed. Check the results for details.`,
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to analyze videos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (content: string) => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "The content has been copied to your clipboard",
          duration: 3000,
        })
      })
      .catch((err) => {
        console.error("Failed to copy: ", err)
        toast({
          variant: "destructive",
          title: "Failed to copy",
          description: "Could not copy to clipboard",
          action: <ToastAction altText="Try again">Try again</ToastAction>,
        })
      })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Enter YouTube URLs</h2>
        <ModelInfo />
      </div>

      <div className="space-y-4">
        {urls.map((url, index) => (
          <UrlInput
            key={index}
            value={url}
            onChange={(value) => handleUrlChange(index, value)}
            onRemove={() => removeUrlField(index)}
            disabled={loading}
            showRemoveButton={urls.length > 1}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-4">
        <Button variant="outline" onClick={addUrlField} disabled={loading} className="flex items-center gap-1">
          <PlusCircle className="h-4 w-4 mr-1" />
          Add Another URL
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summarize" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Summarize
          </TabsTrigger>
          <TabsTrigger value="analyze" className="flex items-center gap-2">
            <FileQuestion className="h-4 w-4" />
            Answer Questions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summarize" className="mt-4">
          <Button onClick={handleSummarize} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700">
            {loading && activeTab === "summarize" ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Summarizing...
              </>
            ) : (
              "Summarize Videos"
            )}
          </Button>
        </TabsContent>

        <TabsContent value="analyze" className="mt-4 space-y-4">
          <QuestionInput
            value={questions}
            onChange={setQuestions}
            disabled={loading}
            language={language}
            onLanguageChange={setLanguage}
          />

          <Button onClick={handleAnalyze} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700">
            {loading && activeTab === "analyze" ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Answer Questions"
            )}
          </Button>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {summary && activeTab === "summarize" && (
        <Card className="p-4 relative">
          <div className="absolute top-4 right-4">
            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(summary)} aria-label="Copy to clipboard">
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {summaryInfo && summaryInfo.videoCount > 1 && (
            <div className="mb-4 flex items-center gap-2">
              <Badge variant={summaryInfo.areVideosRelated ? "default" : "outline"} className="px-2 py-1">
                {summaryInfo.videoCount} Videos
              </Badge>

              {summaryInfo.areVideosRelated && (
                <Badge variant="secondary" className="px-2 py-1 flex items-center gap-1">
                  <Link2 className="h-3 w-3" />
                  Related Content
                </Badge>
              )}
            </div>
          )}

          <div className="prose max-w-none dark:prose-invert">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        </Card>
      )}

      {analysis && activeTab === "analyze" && (
        <Card className="p-4 relative">
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(analysis)}
              aria-label="Copy to clipboard"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="prose max-w-none dark:prose-invert">
            <ReactMarkdown>{analysis}</ReactMarkdown>
          </div>
        </Card>
      )}
    </div>
  )
}
