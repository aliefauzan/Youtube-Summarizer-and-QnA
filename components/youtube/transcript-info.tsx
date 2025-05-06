"use client"

import { useState, useEffect } from "react"
import { FileText, Check, AlertTriangle, Globe, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getAvailableTranscriptLanguages } from "@/lib/transcript-service"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TranscriptInfoProps {
  videoId: string
  hasTranscript: boolean
  transcriptDisabled?: boolean
  onLanguageChange?: (language: string) => void
}

export function TranscriptInfo({ videoId, hasTranscript, transcriptDisabled, onLanguageChange }: TranscriptInfoProps) {
  const [availableLanguages, setAvailableLanguages] = useState<{ code: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en")

  useEffect(() => {
    if (videoId && hasTranscript && !transcriptDisabled) {
      fetchLanguages()
    }
  }, [videoId, hasTranscript, transcriptDisabled])

  const fetchLanguages = async () => {
    setIsLoading(true)
    try {
      const languages = await getAvailableTranscriptLanguages(videoId)
      setAvailableLanguages(languages)
    } catch (error) {
      console.error("Error fetching transcript languages:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLanguageSelect = (code: string) => {
    setSelectedLanguage(code)
    if (onLanguageChange) {
      onLanguageChange(code)
    }
  }

  if (transcriptDisabled) {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        <span>Transcript Disabled</span>
      </Badge>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {hasTranscript ? (
        <>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span>Transcript Available</span>
          </Badge>

          {availableLanguages.length > 0 && (
            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 px-2">
                        <Globe className="h-3.5 w-3.5 mr-1" />
                        <span className="text-xs">
                          {availableLanguages.find((l) => l.code === selectedLanguage)?.name || "Language"}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Select transcript language</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>Transcript Languages</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup className="max-h-[200px] overflow-y-auto">
                  {availableLanguages.map((language) => (
                    <DropdownMenuItem
                      key={language.code}
                      className="flex items-center justify-between"
                      onSelect={() => handleLanguageSelect(language.code)}
                    >
                      <span>{language.name}</span>
                      {language.code === selectedLanguage && <Check className="h-4 w-4" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </>
      ) : (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          <span>Using Description (No Transcript)</span>
        </Badge>
      )}
    </div>
  )
}
