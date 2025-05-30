"use client"

import { useState, useCallback, useRef, type ReactElement } from "react"
import { ArrowDown, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"
import { useAutoScroll } from "@/hooks/use-auto-scroll"
import { Button } from "@/components/ui/button"
import { type Message } from "@/components/ui/chat-message"
import { type MessagePart } from "@/components/ui/chat-message"
import { CopyButton } from "@/components/ui/copy-button"
import { FeedbackDialog } from "@/components/ui/feedback-dialog"
import { MessageList } from "@/components/ui/message-list"

interface ChatMessagesProps {
  messages: Array<Message>
  className?: string
  onRateResponse?: (
    messageId: string,
    rating: "thumbs-up" | "thumbs-down"
  ) => void
  onSubmitFeedback?: (
    messageId: string,
    feedback: string,
    rating: "thumbs-up" | "thumbs-down"
  ) => void
  onRetryResponse?: (messageId: string) => void
  setMessages?: (messages: Message[]) => void
  mode?: 'agent' | 'chat'
  setMode?: (mode: 'agent' | 'chat') => void
  append?: (message: { role: "user"; content: string }) => void
  stop?: () => void
  submittedFeedback?: Record<string, "thumbs-up" | "thumbs-down">
  onFeedbackSubmitted?: (messageId: string, feedback: "thumbs-up" | "thumbs-down") => void
}

export function ChatMessages({
  messages,
  className,
  onRateResponse,
  onSubmitFeedback,
  onRetryResponse,
  setMessages,
  mode,
  setMode,
  append,
  stop,
  submittedFeedback = {},
  onFeedbackSubmitted,
}: ChatMessagesProps) {
  const [feedbackDialog, setFeedbackDialog] = useState<{
    isOpen: boolean
    messageId: string
    feedbackType: "thumbs-up" | "thumbs-down"
  }>({
    isOpen: false,
    messageId: "",
    feedbackType: "thumbs-up"
  })
  const lastMessage = messages.at(-1)
  const isTyping = lastMessage?.role === "user"

  const messagesRef = useRef(messages)
  messagesRef.current = messages

  // Enhanced stop function that marks pending tool calls as cancelled
  const handleStop = useCallback(() => {
    stop?.()

    if (!setMessages) return

    const latestMessages = [...messagesRef.current]
    const lastAssistantMessage = latestMessages.findLast(
      (m) => m.role === "assistant"
    )

    if (!lastAssistantMessage) return

    let needsUpdate = false
    let updatedMessage = { ...lastAssistantMessage }

    if (lastAssistantMessage.toolInvocations) {
      const updatedToolInvocations = lastAssistantMessage.toolInvocations.map(
        (toolInvocation) => {
          if (toolInvocation.state === "call") {
            needsUpdate = true
            return {
              ...toolInvocation,
              state: "result",
              result: {
                content: "Tool execution was cancelled",
                __cancelled: true, // Special marker to indicate cancellation
              },
            } as const
          }
          return toolInvocation
        }
      )

      if (needsUpdate) {
        updatedMessage = {
          ...updatedMessage,
          toolInvocations: updatedToolInvocations,
        }
      }
    }

    if (lastAssistantMessage.parts && lastAssistantMessage.parts.length > 0) {
      const updatedParts = lastAssistantMessage.parts.map((part: MessagePart) => {
        if (
          part.type === "tool-invocation" &&
          part.toolInvocation &&
          part.toolInvocation.state === "call"
        ) {
          needsUpdate = true
          return {
            ...part,
            toolInvocation: {
              ...part.toolInvocation,
              state: "result" as const,
              result: {
                content: "Tool execution was cancelled",
                __cancelled: true,
              },
            },
          }
        }
        return part
      })

      if (needsUpdate) {
        updatedMessage = {
          ...updatedMessage,
          parts: updatedParts,
        }
      }
    }    if (needsUpdate) {
      const updatedMessages = latestMessages.map((m) =>
        m === lastAssistantMessage ? updatedMessage : m
      )
      setMessages(updatedMessages)
    }
  }, [setMessages, stop])
  const handleFeedbackClick = useCallback((messageId: string, feedbackType: "thumbs-up" | "thumbs-down") => {
    // Don't allow feedback if already submitted
    if (submittedFeedback[messageId]) {
      return
    }

    if (onSubmitFeedback) {
      setFeedbackDialog({
        isOpen: true,
        messageId,
        feedbackType
      })
    } else if (onRateResponse) {
      onRateResponse(messageId, feedbackType)
      // Mark as submitted for simple rating
      onFeedbackSubmitted?.(messageId, feedbackType)
    }
  }, [onSubmitFeedback, onRateResponse, submittedFeedback, onFeedbackSubmitted])
  const handleFeedbackSubmit = useCallback(async (feedback: string, rating: "thumbs-up" | "thumbs-down") => {
    if (onSubmitFeedback && feedbackDialog.messageId) {
      await onSubmitFeedback(feedbackDialog.messageId, feedback, rating)
      // Mark as submitted after successful submission
      onFeedbackSubmitted?.(feedbackDialog.messageId, rating)
    }
  }, [onSubmitFeedback, feedbackDialog.messageId, onFeedbackSubmitted])

  const handleFeedbackClose = useCallback(() => {
    setFeedbackDialog(prev => ({ ...prev, isOpen: false }))
  }, [])

  const handleRetry = useCallback((messageId: string) => {
    if (onRetryResponse) {
      onRetryResponse(messageId)
    }
  }, [onRetryResponse])
  const messageOptions = useCallback(
    (message: Message) => {
      const messageHasFeedback = !!submittedFeedback[message.id]
      const submittedFeedbackType = submittedFeedback[message.id]

      return {
        actions: message.role === "assistant" ? (
          <>
            <div className="border-r pr-1">
              <CopyButton
                content={message.content}
                copyMessage="Copied response to clipboard!"
              />
            </div>
            {(onRateResponse || onSubmitFeedback) && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={messageHasFeedback}
                  className={cn(
                    "h-6 w-6 transition-colors",
                    messageHasFeedback && submittedFeedbackType === "thumbs-up"
                      ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 cursor-default"
                      : messageHasFeedback
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400"
                  )}
                  onClick={() => handleFeedbackClick(message.id, "thumbs-up")}
                  title={
                    messageHasFeedback && submittedFeedbackType === "thumbs-up"
                      ? "Positive feedback submitted"
                      : messageHasFeedback
                      ? "Feedback already submitted"
                      : "Good response"
                  }
                >
                  <ThumbsUp 
                    className={cn(
                      "h-4 w-4",
                      messageHasFeedback && submittedFeedbackType === "thumbs-up" && "fill-current"
                    )} 
                  />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={messageHasFeedback}
                  className={cn(
                    "h-6 w-6 transition-colors",
                    messageHasFeedback && submittedFeedbackType === "thumbs-down"
                      ? "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 cursor-default"
                      : messageHasFeedback
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  )}
                  onClick={() => handleFeedbackClick(message.id, "thumbs-down")}
                  title={
                    messageHasFeedback && submittedFeedbackType === "thumbs-down"
                      ? "Negative feedback submitted"
                      : messageHasFeedback
                      ? "Feedback already submitted"
                      : "Poor response"
                  }
                >
                  <ThumbsDown 
                    className={cn(
                      "h-4 w-4",
                      messageHasFeedback && submittedFeedbackType === "thumbs-down" && "fill-current"
                    )} 
                  />
                </Button>
              </>
            )}
            {onRetryResponse && (
              <div className="border-l pl-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-colors"
                  onClick={() => handleRetry(message.id)}
                  title="Regenerate response"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : message.role === "user" ? (
          <CopyButton
            content={message.content}
            copyMessage="Copied message to clipboard!"
          />
        ) : null,
      }
    },
    [handleFeedbackClick, onRetryResponse, handleRetry, onRateResponse, onSubmitFeedback, submittedFeedback]
  )

  const {
    containerRef,
    scrollToBottom,
    handleScroll,
    shouldAutoScroll,
    handleTouchStart,
  } = useAutoScroll([messages])

  if (messages.length === 0) {
    return null
  }
  return (
    <motion.div
      className={cn("flex flex-col h-full chat-container", className)}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 25,
        duration: 0.6
      }}
    >      <div
        className="grid grid-cols-1 overflow-hidden pb-4 flex-1 message-list"
        ref={containerRef}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
      >
        <div className="max-w-full [grid-column:1/1] [grid-row:1/1]">
          <MessageList
            messages={messages}
            isTyping={isTyping}
            messageOptions={messageOptions}
            mode={mode}
            setMode={setMode}
            append={append}
          />
        </div>

        {!shouldAutoScroll && (
          <div className="pointer-events-none flex flex-1 items-end justify-end [grid-column:1/1] [grid-row:1/1]">
            <div className="sticky bottom-0 left-0 flex w-full justify-end">
              <Button
                onClick={scrollToBottom}
                variant="outline"
                size="sm"
                className="pointer-events-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
              >
                <ArrowDown className="size-3" />
                Scroll to bottom
              </Button>
            </div>          </div>
        )}
      </div>

      {onSubmitFeedback && (
        <FeedbackDialog
          isOpen={feedbackDialog.isOpen}
          onClose={handleFeedbackClose}
          feedbackType={feedbackDialog.feedbackType}
          onSubmit={handleFeedbackSubmit}
          messageId={feedbackDialog.messageId}
        />
      )}
    </motion.div>
  )
}
