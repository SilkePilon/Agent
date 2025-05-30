"use client"

import { useState, useCallback, useRef, type ReactElement } from "react"
import { ArrowDown, ThumbsDown, ThumbsUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"
import { useAutoScroll } from "@/hooks/use-auto-scroll"
import { Button } from "@/components/ui/button"
import { type Message } from "@/components/ui/chat-message"
import { type MessagePart } from "@/components/ui/chat-message"
import { CopyButton } from "@/components/ui/copy-button"
import { MessageList } from "@/components/ui/message-list"

interface ChatMessagesProps {
  messages: Array<Message>
  className?: string
  onRateResponse?: (
    messageId: string,
    rating: "thumbs-up" | "thumbs-down"
  ) => void
  setMessages?: (messages: Message[]) => void
  mode?: 'agent' | 'chat'
  setMode?: (mode: 'agent' | 'chat') => void
  append?: (message: { role: "user"; content: string }) => void
  stop?: () => void
}

export function ChatMessages({
  messages,
  className,
  onRateResponse,
  setMessages,
  mode,
  setMode,
  append,
  stop,
}: ChatMessagesProps) {
  const lastMessage = messages.at(-1)
  const isTyping = lastMessage?.role === "user"
  const lastMessageContent = messages.at(-1)?.content; // Get last message content

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
    }

    if (needsUpdate) {
      const updatedMessages = latestMessages.map((m) =>
        m === lastAssistantMessage ? updatedMessage : m
      )
      setMessages(updatedMessages)
    }
  }, [setMessages, stop])
  const messageOptions = useCallback(
    (message: Message) => ({
      actions: onRateResponse ? (
        <>
          <div className="border-r pr-1">
            <CopyButton
              content={message.content}
              copyMessage="Copied response to clipboard!"
            />
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => onRateResponse(message.id, "thumbs-up")}
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => onRateResponse(message.id, "thumbs-down")}
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <CopyButton
          content={message.content}
          copyMessage="Copied response to clipboard!"
        />
      ),
    }),
    [onRateResponse]
  )

  const {
    containerRef,
    scrollToBottom,
    handleScroll,
    shouldAutoScroll,
    handleTouchStart,
  } = useAutoScroll([messages, lastMessageContent]) // Add lastMessageContent to dependencies

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
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
