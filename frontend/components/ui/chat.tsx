"use client"

import {
  forwardRef,
  useCallback,
  useRef,
  useState,
  type ReactElement,
} from "react"
import { ArrowDown, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAutoScroll } from "@/hooks/use-auto-scroll"
import { Button } from "@/components/ui/button"
import { type Message } from "@/components/ui/chat-message"
import { type MessagePart } from "@/components/ui/chat-message"
import { CopyButton } from "@/components/ui/copy-button"
import { FeedbackDialog } from "@/components/ui/feedback-dialog"
import { MessageInput } from "@/components/ui/message-input"
import { MessageList } from "@/components/ui/message-list"
import { PromptSuggestions } from "@/components/ui/prompt-suggestions"

interface ChatPropsBase {
  handleSubmit: (
    event?: { preventDefault?: () => void },
    options?: { experimental_attachments?: FileList }
  ) => void
  messages: Array<Message>
  input: string
  className?: string
  handleInputChange: React.ChangeEventHandler<HTMLTextAreaElement>
  isGenerating: boolean
  stop?: () => void
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
  transcribeAudio?: (blob: Blob) => Promise<string>
  mode?: 'agent' | 'chat'
  setMode?: (mode: 'agent' | 'chat') => void
  provider?: 'openrouter' | 'google'
  setProvider?: (provider: 'openrouter' | 'google') => void
  selectedModel?: string
  setSelectedModel?: (model: string) => void
}

interface ChatPropsWithoutSuggestions extends ChatPropsBase {
  append?: never
  suggestions?: never
}

interface ChatPropsWithSuggestions extends ChatPropsBase {
  append: (message: { role: "user"; content: string }) => void
  suggestions: string[]
}

type ChatProps = ChatPropsWithoutSuggestions | ChatPropsWithSuggestions

export function Chat({
  messages,
  handleSubmit,
  input,
  handleInputChange,
  stop,
  isGenerating,
  append,
  suggestions,
  className,
  onRateResponse,
  onSubmitFeedback,
  onRetryResponse,
  setMessages,
  transcribeAudio,
  mode,
  setMode,
  provider,
  setProvider,
  selectedModel,
  setSelectedModel,
}: ChatProps) {
  const [feedbackDialog, setFeedbackDialog] = useState<{
    isOpen: boolean
    messageId: string
    feedbackType: "thumbs-up" | "thumbs-down"
  }>({
    isOpen: false,
    messageId: "",
    feedbackType: "thumbs-up"
  })
  
  // Track submitted feedback for each message
  const [submittedFeedback, setSubmittedFeedback] = useState<Record<string, "thumbs-up" | "thumbs-down">>({})
  
  const lastMessage = messages.at(-1)
  const isEmpty = messages.length === 0
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
    }

    if (needsUpdate) {
      const messageIndex = latestMessages.findIndex(
        (m) => m.id === lastAssistantMessage.id
      )
      if (messageIndex !== -1) {
        latestMessages[messageIndex] = updatedMessage
        setMessages(latestMessages)
      }
    }
  }, [stop, setMessages, messagesRef])
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
      setSubmittedFeedback(prev => ({
        ...prev,
        [messageId]: feedbackType
      }))
    }
  }, [onSubmitFeedback, onRateResponse, submittedFeedback])
  const handleFeedbackSubmit = useCallback(async (feedback: string, rating: "thumbs-up" | "thumbs-down") => {
    if (onSubmitFeedback && feedbackDialog.messageId) {
      await onSubmitFeedback(feedbackDialog.messageId, feedback, rating)
      // Mark as submitted after successful submission
      setSubmittedFeedback(prev => ({
        ...prev,
        [feedbackDialog.messageId]: rating
      }))
    }
  }, [onSubmitFeedback, feedbackDialog.messageId])

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
  return (
    <ChatContainer className={className}>
      {messages.length > 0 ? (
        <ChatMessages messages={messages}>
          <MessageList
            messages={messages}
            isTyping={isTyping}
            messageOptions={messageOptions}
            mode={mode}
            setMode={setMode}
            append={append}
            modelId={selectedModel}
            modelProvider={provider}
          />
        </ChatMessages>
      ) : null}

      <ChatForm
        className={messages.length > 0 ? "mt-auto sticky bottom-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 p-4 z-10" : ""}
        isPending={isGenerating || isTyping}
        handleSubmit={handleSubmit}
      >
        {({ files, setFiles }) => (
          <MessageInput
            value={input}
            onChange={handleInputChange}
            allowAttachments
            files={files}
            setFiles={setFiles}
            stop={handleStop}
            isGenerating={isGenerating}
            transcribeAudio={transcribeAudio}
            mode={mode}
            setMode={setMode}
            provider={provider}
            setProvider={setProvider}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
          />
        )}
      </ChatForm>

      {onSubmitFeedback && (
        <FeedbackDialog
          isOpen={feedbackDialog.isOpen}
          onClose={handleFeedbackClose}
          feedbackType={feedbackDialog.feedbackType}
          onSubmit={handleFeedbackSubmit}
          messageId={feedbackDialog.messageId}
        />
      )}
    </ChatContainer>
  )
}
Chat.displayName = "Chat"

export function ChatMessages({
  messages,
  children,
}: React.PropsWithChildren<{
  messages: Message[]
}>) {
  const {
    containerRef,
    scrollToBottom,
    handleScroll,
    shouldAutoScroll,
    handleTouchStart,
  } = useAutoScroll([messages])

  return (
    <div
      className="grid grid-cols-1 overflow-y-auto pb-4"
      ref={containerRef}
      onScroll={handleScroll}
      onTouchStart={handleTouchStart}
    >
      <div className="max-w-full [grid-column:1/1] [grid-row:1/1]">
        {children}
      </div>

      {!shouldAutoScroll && (
        <div className="pointer-events-none flex flex-1 items-end justify-end [grid-column:1/1] [grid-row:1/1]">
          <div className="sticky bottom-0 left-0 flex w-full justify-end">
            <Button
              onClick={scrollToBottom}
              className="pointer-events-auto h-8 w-8 rounded-full ease-in-out animate-in fade-in-0 slide-in-from-bottom-1"
              size="icon"
              variant="ghost"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export const ChatContainer = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col w-full h-full", className)}
      {...props}
    />
  )
})
ChatContainer.displayName = "ChatContainer"

interface ChatFormProps {
  className?: string
  isPending: boolean
  handleSubmit: (
    event?: { preventDefault?: () => void },
    options?: { experimental_attachments?: FileList }
  ) => void
  children: (props: {
    files: File[] | null
    setFiles: React.Dispatch<React.SetStateAction<File[] | null>>
  }) => ReactElement
}

export const ChatForm = forwardRef<HTMLFormElement, ChatFormProps>(
  ({ children, handleSubmit, isPending, className }, ref) => {
    const [files, setFiles] = useState<File[] | null>(null)

    const onSubmit = (event: React.FormEvent) => {
      if (!files) {
        handleSubmit(event)
        return
      }

      const fileList = createFileList(files)
      handleSubmit(event, { experimental_attachments: fileList })
      setFiles(null)
    }

    return (
      <form ref={ref} onSubmit={onSubmit} className={className}>
        {children({ files, setFiles })}
      </form>
    )
  }
)
ChatForm.displayName = "ChatForm"

function createFileList(files: File[] | FileList): FileList {
  const dataTransfer = new DataTransfer()
  for (const file of Array.from(files)) {
    dataTransfer.items.add(file)
  }
  return dataTransfer.files
}
