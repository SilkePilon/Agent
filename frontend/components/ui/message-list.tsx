import {
  ChatMessage,
  type ChatMessageProps,
  type Message,
} from "@/components/ui/chat-message"
import { TypingIndicator } from "@/components/ui/typing-indicator"

type AdditionalMessageOptions = Omit<ChatMessageProps, keyof Message>

interface MessageListProps {
  messages: Message[]
  showTimeStamps?: boolean
  isTyping?: boolean
  messageOptions?:
    | AdditionalMessageOptions
    | ((message: Message) => AdditionalMessageOptions)
  mode?: 'agent' | 'chat'
  setMode?: (mode: 'agent' | 'chat') => void
  append?: (message: { role: "user"; content: string }) => void
}

export function MessageList({
  messages,
  showTimeStamps = true,
  isTyping = false,
  messageOptions,
  mode,
  setMode,
  append,
}: MessageListProps) {
  return (
    <div className="space-y-4 overflow-hidden w-full max-w-full message-list-container">
      {messages.map((message, index) => {
        const additionalOptions =
          typeof messageOptions === "function"
            ? messageOptions(message)
            : messageOptions

        return (
          <div
            key={`${message.id}-${index}`}
          >
            <ChatMessage
              showTimeStamp={showTimeStamps}
              animation="none"
              {...message}
              {...additionalOptions}
              mode={mode}
              setMode={setMode}
              append={append}
            />
          </div>
        )
      })}
      {isTyping && (
        <div>
          <TypingIndicator />
        </div>
      )}
    </div>
  )
}
