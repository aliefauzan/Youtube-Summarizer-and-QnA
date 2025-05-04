"use client"

import { useState } from "react"
import { Check, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Language options with their native names
const languages = [
  { code: "en", name: "English", native: "English" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia" },
  { code: "es", name: "Spanish", native: "Español" },
  { code: "fr", name: "French", native: "Français" },
  { code: "de", name: "German", native: "Deutsch" },
  { code: "zh", name: "Chinese", native: "中文" },
  { code: "ja", name: "Japanese", native: "日本語" },
  { code: "ko", name: "Korean", native: "한국어" },
  { code: "ar", name: "Arabic", native: "العربية" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "pt", name: "Portuguese", native: "Português" },
  { code: "ru", name: "Russian", native: "Русский" },
]

interface LanguageSelectorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function LanguageSelector({ value, onChange, disabled = false }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedLanguage = languages.find((lang) => lang.code === value) || languages[0]

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
          <Globe className="h-3.5 w-3.5 mr-1" />
          <span>{selectedLanguage.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>Select Language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="max-h-[300px] overflow-y-auto">
          {languages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              className="flex items-center justify-between"
              onSelect={() => {
                onChange(language.code)
                setIsOpen(false)
              }}
            >
              <div className="flex items-center">
                <span>{language.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">({language.native})</span>
              </div>
              {language.code === value && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
