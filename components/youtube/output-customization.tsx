"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Settings2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"

export interface OutputSettings {
  format: "markdown" | "pdf" | "docx"
  fontFamily: string
  fontSize: number
  lineSpacing: number
  minPages: number
  maxPages: number
  includeReferences: boolean
  formalTone: boolean
  summaryStyle: "concise" | "detailed" | "academic"
  language: string
}

interface OutputCustomizationProps {
  settings: OutputSettings
  onChange: (settings: OutputSettings) => void
  disabled?: boolean
}

export function OutputCustomization({ settings, onChange, disabled = false }: OutputCustomizationProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const updateSettings = (key: keyof OutputSettings, value: any) => {
    onChange({
      ...settings,
      [key]: value,
    })
  }

  // Helper function to format line spacing display
  const formatLineSpacing = (value: number) => {
    return value.toFixed(1)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Output Customization
          </CardTitle>
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
        <CardDescription>Customize how your summaries and answers are formatted</CardDescription>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="format">Output Format</Label>
              <Select
                disabled={disabled}
                value={settings.format}
                onValueChange={(value) => updateSettings("format", value)}
              >
                <SelectTrigger id="format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="markdown">Markdown</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="docx">DOCX</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summaryStyle">Content Style</Label>
              <Select
                disabled={disabled}
                value={settings.summaryStyle}
                onValueChange={(value) => updateSettings("summaryStyle", value as "concise" | "detailed" | "academic")}
              >
                <SelectTrigger id="summaryStyle">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concise">Concise</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(settings.format === "pdf" || settings.format === "docx") && (
            <>
              <Separator className="my-2" />
              <h3 className="text-sm font-medium mb-2">Document Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fontFamily">Font Family</Label>
                  <Select
                    disabled={disabled}
                    value={settings.fontFamily}
                    onValueChange={(value) => updateSettings("fontFamily", value)}
                  >
                    <SelectTrigger id="fontFamily">
                      <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Times-Roman">Times New Roman</SelectItem>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Courier">Courier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fontSize">Font Size: {settings.fontSize}</Label>
                  <Slider
                    id="fontSize"
                    disabled={disabled}
                    min={8}
                    max={16}
                    step={1}
                    value={[settings.fontSize]}
                    onValueChange={(value) => updateSettings("fontSize", value[0])}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lineSpacing" className="flex justify-between">
                    <span>Line Spacing:</span>
                    <span className="font-medium">{formatLineSpacing(settings.lineSpacing)}</span>
                  </Label>
                  <div className="pt-2">
                    <Slider
                      id="lineSpacing"
                      disabled={disabled}
                      min={1.0}
                      max={2.5}
                      step={0.1}
                      value={[settings.lineSpacing]}
                      onValueChange={(value) => updateSettings("lineSpacing", value[0])}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground pt-1">
                    <span>Single</span>
                    <span>Double</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Page Limits</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      disabled={disabled}
                      min={1}
                      max={settings.maxPages}
                      value={settings.minPages}
                      onChange={(e) => updateSettings("minPages", Number.parseInt(e.target.value))}
                      className="w-20"
                    />
                    <span>to</span>
                    <Input
                      type="number"
                      disabled={disabled}
                      min={settings.minPages}
                      value={settings.maxPages}
                      onChange={(e) => updateSettings("maxPages", Number.parseInt(e.target.value))}
                      className="w-20"
                    />
                    <span>pages</span>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator className="my-2" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="includeReferences" className="cursor-pointer">
                Include References
              </Label>
              <Switch
                id="includeReferences"
                disabled={disabled}
                checked={settings.includeReferences}
                onCheckedChange={(checked) => updateSettings("includeReferences", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="formalTone" className="cursor-pointer">
                Formal Academic Tone
              </Label>
              <Switch
                id="formalTone"
                disabled={disabled}
                checked={settings.formalTone}
                onCheckedChange={(checked) => updateSettings("formalTone", checked)}
              />
            </div>
          </div>
        </CardContent>
      )}

      {isExpanded && (
        <CardFooter className="border-t pt-4 text-xs text-muted-foreground">
          {settings.format === "pdf"
            ? `PDF output will be formatted with ${settings.fontFamily}, ${settings.fontSize}pt font, and ${formatLineSpacing(settings.lineSpacing)} line spacing.`
            : settings.format === "docx"
              ? `DOCX output will be formatted with ${settings.fontFamily}, ${settings.fontSize}pt font, and ${formatLineSpacing(settings.lineSpacing)} line spacing.`
              : "Markdown output will be displayed in the browser and can be copied to clipboard."}
        </CardFooter>
      )}
    </Card>
  )
}
