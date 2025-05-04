"use client"

import { useState, useEffect } from "react"
import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function ModelInfo() {
  const [modelInfo, setModelInfo] = useState<{
    name: string
    isActive: boolean
  }>({
    name: "gemini-2.0-flash-lite",
    isActive: false,
  })

  useEffect(() => {
    // In a real app, you might want to check which model is actually being used
    // For now, we'll just assume the primary model is active
    setModelInfo({
      name: "gemini-2.0-flash-lite",
      isActive: true,
    })
  }, [])

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
            <Info className="h-3 w-3" />
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${modelInfo.isActive ? "bg-green-500" : "bg-amber-500"}`} />
              {modelInfo.name}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Using efficient Gemini model for summarization</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
