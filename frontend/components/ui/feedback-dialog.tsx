"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, X } from "lucide-react"

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
import { Textarea } from "@/components/ui/textarea"
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
  feedbackType,
  onSubmit,
  messageId,
}: FeedbackDialogProps) {
  const [feedback, setFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isMobile = useIsMobile()

  const handleSubmit = async () => {
    if (!feedback.trim()) return
    
    setIsSubmitting(true)
    try {
      await onSubmit(feedback, feedbackType)
      setFeedback("")
      onClose()
    } catch (error) {
      console.error("Failed to submit feedback:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFeedback("")
    onClose()
  }

  const title = feedbackType === "thumbs-up" ? "What did you like?" : "What could be improved?"
  const description = feedbackType === "thumbs-up" 
    ? "Help us understand what made this response helpful."
    : "Your feedback helps us improve future responses."

  const Content = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Textarea
          placeholder={feedbackType === "thumbs-up" 
            ? "This response was helpful because..."
            : "This response could be improved by..."
          }
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="min-h-[100px] resize-none"
          autoFocus
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={handleClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!feedback.trim() || isSubmitting}
          className="gap-2"
        >
          {isSubmitting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
            />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Submit Feedback
        </Button>
      </div>
    </motion.div>
  )

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleClose}>
        <DrawerContent className="px-4 pb-4">
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <Content />
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
        <Content />
      </DialogContent>
    </Dialog>
  )
}
