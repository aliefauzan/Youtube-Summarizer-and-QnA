"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react"

interface QuestionInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  language: string
  onLanguageChange: (language: string) => void
}

export function QuestionInput({ value, onChange, disabled = false, language, onLanguageChange }: QuestionInputProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const exampleQuestions = {
    en: [
      "What are the main topics discussed in these videos?",
      "What technologies or methods are mentioned and their applications?",
      "What are the advantages and challenges of the technologies discussed?",
      "What are the real-world implementations and future potential?",
      "What are the key takeaways from these videos?",
    ],
    id: [
      "Jelaskan secara singkat mengenai topik utama yang dibahas dalam video tersebut.",
      "Sebutkan teknologi atau metode yang dibahas dalam video, serta contoh penerapannya.",
      "Jelaskan potensi keunggulan dan tantangan dari penggunaan teknologi yang dibahas.",
      "Berikan gambaran tentang aplikasi nyata dan prediksi perkembangan teknologi dari video.",
      "Sampaikan pembelajaran apa yang dapat dipetik dari video tersebut.",
    ],
  }

  const handleUseExample = () => {
    const examples = language === "id" ? exampleQuestions.id : exampleQuestions.en
    onChange(examples.join("\n\n"))
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Questions about the videos</CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="text-sm border rounded px-2 py-1"
              disabled={disabled}
            >
              <option value="en">English</option>
              <option value="id">Indonesian</option>
            </select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2"
              disabled={disabled}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </div>
        </div>
        <CardDescription>Ask specific questions about the videos to get targeted insights</CardDescription>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your questions here..."
            className="min-h-[150px] resize-y"
            disabled={disabled}
          />
          <div className="mt-3 flex justify-between">
            <Button variant="outline" size="sm" onClick={handleUseExample} className="text-xs" disabled={disabled}>
              <HelpCircle className="mr-1 h-3 w-3" />
              Use example questions
            </Button>
            <div className="text-xs text-gray-500">{value ? `${value.length} characters` : "No questions yet"}</div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
