"use client"

import { useState } from "react"
import { Mail, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./tooltip"

interface EmailButtonProps {
  onGenerateEmail: () => Promise<{emailSubject: string, emailHtml: string}>
  className?: string
}

export function EmailButton({ onGenerateEmail, className }: EmailButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleClick = async () => {
    if (isGenerating) return
    
    setIsGenerating(true)
    try {
      await onGenerateEmail()
    } catch (error) {
      console.error("Failed to generate email:", error)
    } finally {
      // Add a small delay to make sure the UI updates
      setTimeout(() => {
        setIsGenerating(false)
      }, 500)
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className={cn("h-8 w-8", className)}
          aria-label="Generate email summary"
          onClick={handleClick}
          disabled={isGenerating}
        >          <div className="relative">
            {isGenerating && (
              <span className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-30"></span>
            )}
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            ) : (
              <Mail className="h-4 w-4 transition-all duration-200 hover:text-blue-500 hover:scale-110" />
            )}
          </div>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Generate email summary</p>
      </TooltipContent>
    </Tooltip>
  )
}
