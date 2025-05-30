"use client"

import React, { useState, useEffect } from "react"
import { Send, ThumbsUp, ThumbsDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"

interface FeedbackDialogProps {
  isOpen: boolean
  onClose: () => void
  feedbackType: "thumbs-up" | "thumbs-down"
  onSubmit: (feedback: string, rating: "thumbs-up" | "thumbs-down") => void
  messageId: string
}

export function FeedbackDialog({
  isOpen,
  onClose,
  feedbackType: initialFeedbackType,
  onSubmit,
  messageId,
}: FeedbackDialogProps) {
  const [feedbackText, setFeedbackText] = useState("")
  const [currentFeedbackType, setCurrentFeedbackType] = useState(initialFeedbackType)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isMobile = useIsMobile()

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentFeedbackType(initialFeedbackType)
      setFeedbackText("")
    }
  }, [isOpen, initialFeedbackType])

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFeedbackText(event.target.value)
  }

  const handleSubmit = async () => {
    if (!feedbackText.trim()) return
    
    setIsSubmitting(true)
    try {
      await onSubmit(feedbackText, currentFeedbackType)
      handleClose()
    } catch (error) {
      console.error("Failed to submit feedback:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFeedbackText("")
    setIsSubmitting(false)
    onClose()
  }

  const title = currentFeedbackType === "thumbs-up" ? "What did you like?" : "What could be improved?"
  const description = currentFeedbackType === "thumbs-up" 
    ? "Help us understand what made this response helpful."
    : "Your feedback helps us improve future responses."

  const ContentComponent = () => (
    <div className="space-y-6">
      {/* Feedback Type Toggle */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg">
        <Button
          type="button"
          variant={currentFeedbackType === "thumbs-up" ? "default" : "ghost"}
          size="sm"
          className={cn(
            "flex-1 gap-2",
            currentFeedbackType === "thumbs-up" 
              ? "bg-green-500 text-white hover:bg-green-600" 
              : "hover:bg-green-100 hover:text-green-600"
          )}
          onClick={() => setCurrentFeedbackType("thumbs-up")}
        >
          <ThumbsUp className="h-4 w-4" />
          Helpful
        </Button>
        <Button
          type="button"
          variant={currentFeedbackType === "thumbs-down" ? "default" : "ghost"}
          size="sm"
          className={cn(
            "flex-1 gap-2",
            currentFeedbackType === "thumbs-down" 
              ? "bg-red-500 text-white hover:bg-red-600" 
              : "hover:bg-red-100 hover:text-red-600"
          )}
          onClick={() => setCurrentFeedbackType("thumbs-down")}
        >
          <ThumbsDown className="h-4 w-4" />
          Needs work
        </Button>
      </div>

      {/* Text Input */}
      <div>
        <textarea
          value={feedbackText}
          onChange={handleTextChange}
          placeholder={
            currentFeedbackType === "thumbs-up"
              ? "This response was helpful because..."
              : "This response could be improved by..."
          }
          className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
          disabled={isSubmitting}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!feedbackText.trim() || isSubmitting}
          className="gap-2"
        >
          {isSubmitting ? (
            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Submit Feedback
        </Button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleClose}>
        <DrawerContent className="px-4 pb-4">
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <ContentComponent />
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ContentComponent />
      </DialogContent>
    </Dialog>
  )
}
