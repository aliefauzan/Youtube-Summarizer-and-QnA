"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, Eye, Edit2, FileText, Download, X } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { useToast } from "@/components/ui/use-toast"
import type { OutputSettings } from "@/components/youtube/output-customization"

interface DocumentEditorProps {
  content: string
  onSave: (content: string, feedback: string) => void
  outputSettings: OutputSettings
  onExport: (format: "pdf" | "docx") => void
  isExporting: boolean
  title?: string
}

export function DocumentEditor({
  content,
  onSave,
  outputSettings,
  onExport,
  isExporting,
  title = "Document",
}: DocumentEditorProps) {
  const [editedContent, setEditedContent] = useState(content)
  const [feedback, setFeedback] = useState("")
  const [activeTab, setActiveTab] = useState("preview")
  const [hasChanges, setHasChanges] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  // Update edited content when original content changes
  useEffect(() => {
    if (!hasChanges) {
      setEditedContent(content)
    }
  }, [content, hasChanges])

  // Check for changes
  useEffect(() => {
    setHasChanges(content !== editedContent)
  }, [content, editedContent])

  const handleSave = () => {
    onSave(editedContent, feedback)
    setHasChanges(false)
    toast({
      title: "Changes saved",
      description: "Your edits and feedback have been saved",
      duration: 3000,
    })
  }

  const handleDiscard = () => {
    setEditedContent(content)
    setHasChanges(false)
    toast({
      title: "Changes discarded",
      description: "Your edits have been discarded",
      duration: 3000,
    })
  }

  const handleEdit = () => {
    setIsEditing(true)
    setActiveTab("edit")
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }, 100)
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex gap-2">
            {hasChanges && (
              <>
                <Button size="sm" variant="outline" onClick={handleDiscard} className="h-8 gap-1">
                  <X className="h-4 w-4 mr-1" />
                  Discard
                </Button>
                <Button size="sm" onClick={handleSave} className="h-8 gap-1">
                  <Save className="h-4 w-4 mr-1" />
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="edit" className="flex items-center gap-2">
                <Edit2 className="h-4 w-4" />
                Edit
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="preview" className="p-6 pt-4">
            <div className="prose max-w-none dark:prose-invert">
              <ReactMarkdown>{editedContent}</ReactMarkdown>
            </div>
            {!isEditing && (
              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={handleEdit}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Content
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="edit" className="p-6 pt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="content-editor">Edit Content</Label>
                <Textarea
                  ref={textareaRef}
                  id="content-editor"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                />
              </div>
              <div>
                <Label htmlFor="feedback">Feedback or Notes</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Add any feedback or notes about your changes..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4">
        <div className="text-sm text-muted-foreground">
          {outputSettings.format === "pdf"
            ? `PDF output with ${outputSettings.fontFamily}, ${outputSettings.fontSize}pt, ${outputSettings.lineSpacing} spacing`
            : "Markdown output"}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport("pdf")}
            disabled={isExporting}
            className="h-8 gap-1"
          >
            <Download className="h-4 w-4 mr-1" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport("docx")}
            disabled={isExporting}
            className="h-8 gap-1"
          >
            <FileText className="h-4 w-4 mr-1" />
            DOCX
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
