"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Send, ThumbsUp, ThumbsDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

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

interface FeedbackFormContentProps {
  feedbackText: string
  currentFeedbackType: "thumbs-up" | "thumbs-down"
  isSubmitting: boolean
  placeholder: string
  textAreaRef: React.RefObject<HTMLTextAreaElement | null> // Changed to allow null
  handleTextChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleFeedbackTypeChange: (type: "thumbs-up" | "thumbs-down") => void
  handleSubmit: () => void
  handleClose: () => void
}

const FeedbackFormContent = React.memo(
  ({
    feedbackText,
    currentFeedbackType,
    isSubmitting,
    placeholder,
    textAreaRef, // Type is now React.RefObject<HTMLTextAreaElement | null>
    handleTextChange,
    handleFeedbackTypeChange,
    handleSubmit,
    handleClose,
  }: FeedbackFormContentProps) => {    return (
      <motion.div 
        className="space-y-4 pt-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >{/* Feedback Type Toggle */}
        <motion.div 
          className="flex gap-2 p-1 bg-muted rounded-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <motion.div 
            className="flex-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            animate={currentFeedbackType === "thumbs-up" ? { scale: 1.05 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Button
              type="button"
              variant={currentFeedbackType === "thumbs-up" ? "default" : "ghost"}
              size="sm"
              className={cn(
                "w-full gap-2 transition-all duration-300",
                currentFeedbackType === "thumbs-up"
                  ? "bg-green-500 text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 shadow-md"
                  : "hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400"
              )}
              onClick={() => handleFeedbackTypeChange("thumbs-up")}
            >
              <motion.div 
                layout 
                className="flex items-center justify-center gap-2"
                animate={currentFeedbackType === "thumbs-up" ? { 
                  rotateY: [0, 360],
                  transition: { duration: 0.5, ease: "easeInOut" }
                } : {}}
              >
                <motion.div
                  animate={currentFeedbackType === "thumbs-up" ? { 
                    rotate: [0, 10, -10, 0],
                    transition: { duration: 0.4, ease: "easeInOut" }
                  } : {}}
                >
                  <ThumbsUp className="h-4 w-4" />
                </motion.div>
                Helpful
              </motion.div>
            </Button>
          </motion.div>
          <motion.div 
            className="flex-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            animate={currentFeedbackType === "thumbs-down" ? { scale: 1.05 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Button
              type="button"
              variant={currentFeedbackType === "thumbs-down" ? "default" : "ghost"}
              size="sm"
              className={cn(
                "w-full gap-2 transition-all duration-300",
                currentFeedbackType === "thumbs-down"
                  ? "bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 shadow-md"
                  : "hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              )}
              onClick={() => handleFeedbackTypeChange("thumbs-down")}
            >
              <motion.div 
                layout 
                className="flex items-center justify-center gap-2"
                animate={currentFeedbackType === "thumbs-down" ? { 
                  rotateY: [0, 360],
                  transition: { duration: 0.5, ease: "easeInOut" }
                } : {}}
              >
                <motion.div
                  animate={currentFeedbackType === "thumbs-down" ? { 
                    rotate: [0, -10, 10, 0],
                    transition: { duration: 0.4, ease: "easeInOut" }
                  } : {}}
                >
                  <ThumbsDown className="h-4 w-4" />
                </motion.div>
                Needs work
              </motion.div>
            </Button>
          </motion.div>
        </motion.div>        {/* Text Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <motion.textarea
            ref={textAreaRef}
            value={feedbackText}
            onChange={handleTextChange}
            placeholder={placeholder}
            className="w-full min-h-[100px] p-2.5 border border-input rounded-md bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all duration-200"
            disabled={isSubmitting}
            whileFocus={{ 
              scale: 1.01,
              boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          />
        </motion.div>        {/* Action Buttons */}
        <motion.div 
          className="flex justify-end gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="transition-all duration-200"
            >
              Cancel
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!feedbackText.trim() || isSubmitting}
              className="gap-1.5 w-[150px] transition-all duration-200" // Fixed width for smoother transition
            >
              <AnimatePresence mode="wait">
                {isSubmitting ? (
                  <motion.div
                    key="spinner"
                    initial={{ opacity: 0, y: -10, rotate: 0 }}
                    animate={{ opacity: 1, y: 0, rotate: 360 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ 
                      opacity: { duration: 0.15 },
                      y: { duration: 0.15 },
                      rotate: { duration: 1, repeat: Infinity, ease: "linear" }
                    }}
                    className="flex items-center justify-center"
                  >
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="send-icon"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center justify-center gap-1.5"
                  >
                    <motion.div
                      whileHover={{ x: 2 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Send className="h-4 w-4" />
                    </motion.div>
                    Submit Feedback
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>          </motion.div>
        </motion.div>
      </motion.div>
    )
  }
)
FeedbackFormContent.displayName = "FeedbackFormContent"

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
  messageId, // Not used directly in this component, but good to keep if parent needs it
}: FeedbackDialogProps) {
  const [feedbackText, setFeedbackText] = useState("")
  const [currentFeedbackType, setCurrentFeedbackType] = useState(initialFeedbackType)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isMobile = useIsMobile()
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  const stableOnClose = useCallback(onClose, [onClose])
  const stableOnSubmit = useCallback(onSubmit, [onSubmit])

  useEffect(() => {
    if (isOpen) {
      setCurrentFeedbackType(initialFeedbackType)
      setFeedbackText("")
      // Attempt to focus slightly later, ensuring the element is rendered and animations (if any) are settled.
      setTimeout(() => {
        textAreaRef.current?.focus()
      }, 100) // Increased delay slightly, can be adjusted
    }
  }, [isOpen, initialFeedbackType, textAreaRef]) // Added textAreaRef to deps, though it's stable, for completeness

  const handleTextChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setFeedbackText(event.target.value)
    },
    []
  )

  const handleFeedbackTypeChange = useCallback(
    (type: "thumbs-up" | "thumbs-down") => {
      setCurrentFeedbackType(type)
      // Focus after state update and potential re-render
      setTimeout(() => {
        textAreaRef.current?.focus()
      }, 50) // Retaining a small delay, can be removed if not needed
    },
    [textAreaRef] // Added textAreaRef to deps
  )

  const handleCloseDialog = useCallback(() => {
    stableOnClose()
  }, [stableOnClose])

  const handleSubmitFeedback = useCallback(async () => {
    if (!feedbackText.trim()) return

    setIsSubmitting(true)
    try {
      await stableOnSubmit(feedbackText, currentFeedbackType)
      handleCloseDialog()
    } catch (error) {
      console.error("Failed to submit feedback:", error)
      // Optionally show an error to the user
    } finally {
      setIsSubmitting(false)
    }
  }, [feedbackText, currentFeedbackType, stableOnSubmit, handleCloseDialog])

  const title = currentFeedbackType === "thumbs-up" ? "What did you like?" : "What could be improved?"
  const description =
    currentFeedbackType === "thumbs-up"
      ? "Help us understand what made this response helpful."
      : "Your feedback helps us improve future responses."
  const placeholder =
    currentFeedbackType === "thumbs-up"
      ? "This response was helpful because..."
      : "This response could be improved by..."

  const formContentProps = {
    feedbackText,
    currentFeedbackType,
    isSubmitting,
    placeholder,
    textAreaRef,
    handleTextChange,
    handleFeedbackTypeChange,
    handleSubmit: handleSubmitFeedback,
    handleClose: handleCloseDialog,
  }

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DrawerContent className="px-4 pb-4">
          <DrawerHeader className="text-left pb-2">
            <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>
            <DrawerDescription className="text-muted-foreground">
              {description}
            </DrawerDescription>
          </DrawerHeader>
          <FeedbackFormContent {...formContentProps} />
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>
        <FeedbackFormContent {...formContentProps} />
      </DialogContent>
    </Dialog>
  )
}
