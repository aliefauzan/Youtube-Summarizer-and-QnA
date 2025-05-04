"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChevronDown, ChevronUp, Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface QuestionInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  language: string
  onLanguageChange: (language: string) => void
}

export function QuestionInput({ value, onChange, disabled = false, language, onLanguageChange }: QuestionInputProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Predefined question templates
  const questionTemplates = {
    en: {
      academic: [
        "Main Topic and Overview:",
        "Explain briefly the main topic discussed in the videos and scientific references.",
        "",
        "Technology and Implementation:",
        "List the technologies or methods discussed in the videos and references, along with examples of their application.",
        "",
        "Advantages and Challenges:",
        "Explain the potential advantages and challenges of using the technologies discussed.",
        "",
        "Real-world Implementation and Future Potential:",
        "Provide an overview of real-world applications and predictions for the development of the technologies from the videos and references.",
        "",
        "Personal Opinion:",
        "Share your personal view on the content of the videos and references, and what lessons can be learned.",
      ],
      technical: [
        "Technical Overview:",
        "What are the key technical components and systems described in the videos?",
        "",
        "Implementation Details:",
        "How are these technologies implemented according to the videos? Include specific methods, frameworks, or tools mentioned.",
        "",
        "Performance Analysis:",
        "What performance metrics or benchmarks are discussed in the videos? How do these technologies compare to alternatives?",
        "",
        "Integration Challenges:",
        "What challenges might arise when integrating these technologies into existing systems?",
        "",
        "Future Developments:",
        "Based on the videos, what future developments or improvements are expected in this technology space?",
      ],
      business: [
        "Business Value:",
        "What business value do the technologies in these videos provide?",
        "",
        "Market Analysis:",
        "What market segments or industries would benefit most from these technologies?",
        "",
        "Cost-Benefit Analysis:",
        "What are the potential costs and benefits of implementing these technologies?",
        "",
        "Competitive Advantage:",
        "How might these technologies provide competitive advantages?",
        "",
        "Strategic Recommendations:",
        "What strategic recommendations would you make to businesses considering these technologies?",
      ],
    },
    id: {
      academic: [
        "Inti Video dan Referensi:",
        "Jelaskan secara singkat mengenai topik utama yang dibahas dalam video dan referensi ilmiah tersebut.",
        "",
        "Teknologi dan Implementasi:",
        "Sebutkan teknologi atau metode yang dibahas dalam video dan referensi, serta contoh penerapannya.",
        "",
        "Keunggulan dan Tantangan:",
        "Jelaskan potensi keunggulan dan tantangan dari penggunaan teknologi yang dibahas dalam video.",
        "",
        "Implementasi Nyata dan Potensi Masa Depan:",
        "Berikan gambaran tentang aplikasi nyata dan prediksi perkembangan teknologi dari video dan referensi.",
        "",
        "Pendapat Pribadi:",
        "Sampaikan pandangan Anda pribadi tentang isi video dan referensi serta pembelajaran apa yang dapat dipetik.",
      ],
      technical: [
        "Ikhtisar Teknis:",
        "Apa saja komponen dan sistem teknis utama yang dijelaskan dalam video?",
        "",
        "Detail Implementasi:",
        "Bagaimana teknologi ini diimplementasikan menurut video? Sertakan metode, framework, atau alat spesifik yang disebutkan.",
        "",
        "Analisis Kinerja:",
        "Metrik kinerja atau tolok ukur apa yang dibahas dalam video? Bagaimana teknologi ini dibandingkan dengan alternatif?",
        "",
        "Tantangan Integrasi:",
        "Tantangan apa yang mungkin muncul saat mengintegrasikan teknologi ini ke dalam sistem yang ada?",
        "",
        "Perkembangan Masa Depan:",
        "Berdasarkan video, perkembangan atau peningkatan masa depan apa yang diharapkan dalam ruang teknologi ini?",
      ],
      business: [
        "Nilai Bisnis:",
        "Nilai bisnis apa yang diberikan oleh teknologi dalam video ini?",
        "",
        "Analisis Pasar:",
        "Segmen pasar atau industri mana yang akan paling diuntungkan dari teknologi ini?",
        "",
        "Analisis Biaya-Manfaat:",
        "Apa potensi biaya dan manfaat dari penerapan teknologi ini?",
        "",
        "Keunggulan Kompetitif:",
        "Bagaimana teknologi ini dapat memberikan keunggulan kompetitif?",
        "",
        "Rekomendasi Strategis:",
        "Rekomendasi strategis apa yang akan Anda berikan kepada bisnis yang mempertimbangkan teknologi ini?",
      ],
    },
  }

  const handleUseTemplate = (template: string) => {
    const selectedLanguage = language === "id" ? "id" : "en"
    const selectedTemplate = questionTemplates[selectedLanguage][template as keyof typeof questionTemplates.en]
    onChange(selectedTemplate.join("\n"))
  }

  const handleAddBlockchainTemplate = () => {
    if (language === "id") {
      onChange(
        "Inti Video dan Referensi:\n" +
          "Jelaskan secara singkat mengenai topik utama yang dibahas dalam ketiga video dan referensi ilmiah tersebut.\n\n" +
          "Teknologi dan Implementasi:\n" +
          "Sebutkan teknologi atau metode yang dibahas dalam video dan referensi, serta contoh penerapannya.\n\n" +
          "Keunggulan dan Tantangan:\n" +
          "Jelaskan potensi keunggulan dan tantangan dari penggunaan teknologi blockchain dan smart contract dalam keamanan cerdas.\n\n" +
          "Implementasi Nyata dan Potensi Masa Depan:\n" +
          "Berikan gambaran tentang aplikasi nyata dan prediksi perkembangan teknologi blockchain dan kontrak pintar dari video dan referensi.\n\n" +
          "Pendapat Pribadi:\n" +
          "Sampaikan pandangan Anda pribadi tentang isi ketiga video dan referensi serta pembelajaran apa yang dapat dipetik.",
      )
    } else {
      onChange(
        "Video Core and References:\n" +
          "Briefly explain the main topic discussed in the three videos and scientific references.\n\n" +
          "Technology and Implementation:\n" +
          "List the technologies or methods discussed in the videos and references, along with examples of their application.\n\n" +
          "Advantages and Challenges:\n" +
          "Explain the potential advantages and challenges of using blockchain technology and smart contracts in intelligent security.\n\n" +
          "Real-world Implementation and Future Potential:\n" +
          "Provide an overview of real-world applications and predictions for the development of blockchain technology and smart contracts from the videos and references.\n\n" +
          "Personal Opinion:\n" +
          "Share your personal view on the content of the three videos and references, and what lessons can be learned.",
      )
    }
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
          <div className="mt-3 flex flex-wrap justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <Select disabled={disabled} onValueChange={handleUseTemplate}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue placeholder="Use template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic">Academic Analysis</SelectItem>
                  <SelectItem value="technical">Technical Review</SelectItem>
                  <SelectItem value="business">Business Analysis</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleAddBlockchainTemplate}
                className="text-xs h-8"
                disabled={disabled}
              >
                <Plus className="mr-1 h-3 w-3" />
                Blockchain Template
              </Button>
            </div>
            <div className="text-xs text-gray-500">{value ? `${value.length} characters` : "No questions yet"}</div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
