"use client"

import { useState } from "react"
import { PlusCircle, Trash2, Copy, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ReactMarkdown from "react-markdown"

import { useToast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"

export function YouTubeSummarizer() {
  const [urls, setUrls] = useState<string[]>([""])
  const [summary, setSummary] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")

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
    const validUrls = urls.filter((url) => url.trim() !== "")
    if (validUrls.length === 0) {
      setError("Please enter at least one YouTube URL")
      return
    }

    setLoading(true)
    setError("")
    setSummary("")

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ urls: validUrls }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to summarize videos")
      }

      const data = await response.json()
      setSummary(data.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(summary)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "The summary has been copied to your clipboard",
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
      <div className="space-y-4">
        {urls.map((url, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => handleUrlChange(index, e.target.value)}
              placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=...)"
              className="flex-1"
              disabled={loading}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => removeUrlField(index)}
              disabled={urls.length === 1 || loading}
              aria-label="Remove URL"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4">
        <Button variant="outline" onClick={addUrlField} disabled={loading} className="flex items-center gap-1">
          <PlusCircle className="h-4 w-4 mr-1" />
          Add Another URL
        </Button>

        <Button
          onClick={handleSummarize}
          disabled={loading}
          className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Summarizing...
            </>
          ) : (
            "Summarize Videos"
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {summary && (
        <Card className="p-4 relative">
          <div className="absolute top-4 right-4">
            <Button variant="ghost" size="icon" onClick={copyToClipboard} aria-label="Copy to clipboard">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-xl font-semibold mb-4">Summary</h2>
          <div className="prose max-w-none dark:prose-invert">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        </Card>
      )}
    </div>
  )
}
