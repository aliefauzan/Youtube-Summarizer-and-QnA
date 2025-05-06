"use client"

import { useState, useEffect } from "react"
import {
  PlusCircle,
  Copy,
  Loader2,
  AlertTriangle,
  Link2,
  FileText,
  FileQuestion,
  Download,
  Edit,
  Database,
} from "lucide-react"
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
import { OutputCustomization, type OutputSettings } from "@/components/youtube/output-customization"
import { LanguageSelector } from "@/components/youtube/language-selector"
import { DocumentEditor } from "@/components/youtube/document-editor"
import { ModelInfo } from "@/components/youtube/model-info"
import { CacheManager } from "@/components/youtube/cache-manager"
import { extractVideoId } from "@/lib/youtube"
import { generatePDF } from "@/lib/pdf-generator"
import { generateDOCX } from "@/lib/docx-generator"

export function YouTubeSummarizer() {
  const [urls, setUrls] = useState<string[]>([""])
  const [summary, setSummary] = useState<string>("")
  const [analysis, setAnalysis] = useState<string>("")
  const [questions, setQuestions] = useState<string>("")
  const [language, setLanguage] = useState<string>("en")
  const [transcriptLanguages, setTranscriptLanguages] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("summarize")
  const [showCacheManager, setShowCacheManager] = useState<boolean>(false)
  const [summaryInfo, setSummaryInfo] = useState<{
    areVideosRelated: boolean
    videoCount: number
    errorCount: number
  } | null>(null)
  const [outputSettings, setOutputSettings] = useState<OutputSettings>({
    format: "markdown",
    fontFamily: "Times-Roman",
    fontSize: 12,
    lineSpacing: 1.5,
    minPages: 3,
    maxPages: 6,
    includeReferences: true,
    formalTone: true,
    summaryStyle: "academic",
    language: "en",
  })
  const [editMode, setEditMode] = useState<boolean>(false)
  const [editedContent, setEditedContent] = useState<string>("")
  const [feedback, setFeedback] = useState<string>("")
  const [isExporting, setIsExporting] = useState<boolean>(false)

  const { toast } = useToast()

  // Update output settings when language changes
  useEffect(() => {
    setOutputSettings((prev) => ({
      ...prev,
      language,
    }))
  }, [language])

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

  const handleTranscriptLanguageChange = (videoId: string, language: string) => {
    setTranscriptLanguages((prev) => ({
      ...prev,
      [videoId]: language,
    }))
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
    setEditMode(false)

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          urls: validUrls,
          outputSettings: {
            ...outputSettings,
            language,
          },
          transcriptLanguages,
          feedback: feedback || undefined,
          editedContent: editedContent || undefined,
        }),
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

      // Reset edited content if this is a fresh generation
      if (!data.isEdited) {
        setEditedContent("")
        setFeedback("")
      }

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

      // Notify if content was from cache
      if (data.fromCache) {
        toast({
          title: "Using Cached Result",
          description: "This summary was loaded from cache for faster response.",
          duration: 3000,
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
    setEditMode(false)

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
          outputSettings: {
            ...outputSettings,
            language,
          },
          transcriptLanguages,
          feedback: feedback || undefined,
          editedContent: editedContent || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to analyze videos")
      }

      setAnalysis(data.analysis)

      // Reset edited content if this is a fresh generation
      if (!data.isEdited) {
        setEditedContent("")
        setFeedback("")
      }

      // Check if there were any errors
      if (data.errorCount > 0) {
        toast({
          title: "Warning",
          description: `${data.errorCount} video(s) could not be analyzed. Check the results for details.`,
          variant: "destructive",
          duration: 5000,
        })
      }

      // Notify if content was from cache
      if (data.fromCache) {
        toast({
          title: "Using Cached Result",
          description: "This analysis was loaded from cache for faster response.",
          duration: 3000,
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

  const handleExport = async (format: "pdf" | "docx") => {
    try {
      setIsExporting(true)
      const content = activeTab === "summarize" ? summary : analysis
      const title = activeTab === "summarize" ? "Video Summary" : "Video Analysis"

      let blob: Blob
      let fileExtension: string

      if (format === "pdf") {
        blob = await generatePDF(content, outputSettings, title)
        fileExtension = "pdf"
      } else {
        blob = await generateDOCX(content, outputSettings, title)
        fileExtension = "docx"
      }

      // Create a download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.${fileExtension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: `${format.toUpperCase()} Generated`,
        description: `Your ${format.toUpperCase()} has been generated and downloaded`,
        duration: 3000,
      })
    } catch (err) {
      console.error(`Error generating ${format.toUpperCase()}:`, err)
      toast({
        variant: "destructive",
        title: `${format.toUpperCase()} Generation Failed`,
        description: `Could not generate ${format.toUpperCase()}. Please try again.`,
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleSaveEdits = (newContent: string, newFeedback: string) => {
    setEditedContent(newContent)
    setFeedback(newFeedback)

    // If we're in the summarize tab, update the summary
    if (activeTab === "summarize") {
      setSummary(newContent)
    } else {
      setAnalysis(newContent)
    }

    toast({
      title: "Changes saved",
      description: "Your edits have been saved. Click 'Regenerate' to apply your feedback.",
      duration: 5000,
    })
  }

  const toggleEditMode = () => {
    setEditMode(!editMode)

    // If we're entering edit mode, initialize the edited content
    if (!editMode) {
      setEditedContent(activeTab === "summarize" ? summary : analysis)
    }
  }

  const toggleCacheManager = () => {
    setShowCacheManager(!showCacheManager)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Enter YouTube URLs</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleCacheManager} className="h-8">
            <Database className="h-4 w-4 mr-2" />
            Cache
          </Button>
          <LanguageSelector value={language} onChange={setLanguage} disabled={loading} />
          <ModelInfo />
        </div>
      </div>

      {showCacheManager && <CacheManager />}

      <div className="space-y-4">
        {urls.map((url, index) => (
          <UrlInput
            key={index}
            value={url}
            onChange={(value) => handleUrlChange(index, value)}
            onRemove={() => removeUrlField(index)}
            disabled={loading}
            showRemoveButton={urls.length > 1}
            language={language}
            onTranscriptLanguageChange={handleTranscriptLanguageChange}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-4">
        <Button variant="outline" onClick={addUrlField} disabled={loading} className="flex items-center gap-1">
          <PlusCircle className="h-4 w-4 mr-1" />
          Add Another URL
        </Button>
      </div>

      <OutputCustomization settings={outputSettings} onChange={setOutputSettings} disabled={loading} />

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
                {editedContent ? "Regenerating..." : "Summarizing..."}
              </>
            ) : editedContent ? (
              "Regenerate with Feedback"
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
                {editedContent ? "Regenerating..." : "Analyzing..."}
              </>
            ) : editedContent ? (
              "Regenerate with Feedback"
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

      {summary && activeTab === "summarize" && !editMode && (
        <Card className="p-4 relative">
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(summary)}
              aria-label="Copy to clipboard"
              disabled={loading}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleEditMode} aria-label="Edit content" disabled={loading}>
              <Edit className="h-4 w-4" />
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

          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("pdf")}
              disabled={isExporting}
              className="h-8 gap-1"
            >
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("docx")}
              disabled={isExporting}
              className="h-8 gap-1"
            >
              <FileText className="h-4 w-4 mr-1" />
              DOCX
            </Button>
          </div>
        </Card>
      )}

      {analysis && activeTab === "analyze" && !editMode && (
        <Card className="p-4 relative">
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(analysis)}
              aria-label="Copy to clipboard"
              disabled={loading}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleEditMode} aria-label="Edit content" disabled={loading}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>

          <div className="prose max-w-none dark:prose-invert">
            <ReactMarkdown>{analysis}</ReactMarkdown>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("pdf")}
              disabled={isExporting}
              className="h-8 gap-1"
            >
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("docx")}
              disabled={isExporting}
              className="h-8 gap-1"
            >
              <FileText className="h-4 w-4 mr-1" />
              DOCX
            </Button>
          </div>
        </Card>
      )}

      {/* Document Editor for Edit Mode */}
      {((summary && activeTab === "summarize") || (analysis && activeTab === "analyze")) && editMode && (
        <DocumentEditor
          content={activeTab === "summarize" ? summary : analysis}
          onSave={handleSaveEdits}
          outputSettings={outputSettings}
          onExport={handleExport}
          isExporting={isExporting}
          title={activeTab === "summarize" ? "Video Summary" : "Video Analysis"}
        />
      )}
    </div>
  )
}
