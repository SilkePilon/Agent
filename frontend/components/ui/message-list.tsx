import {
  ChatMessage,
  type ChatMessageProps,
  type Message,
} from "@/components/ui/chat-message"
import { TypingIndicator } from "@/components/ui/typing-indicator"
import { AnimatePresence, motion } from "framer-motion"

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
  messageActionsAlwaysVisible?: boolean
  modelId?: string
  modelProvider?: 'openrouter' | 'google'
}

export function MessageList({
  messages,
  showTimeStamps = true,
  isTyping = false,
  messageOptions,
  mode,
  setMode,
  append,
  messageActionsAlwaysVisible = false,
  modelId,
  modelProvider,
}: MessageListProps) {
  return (
    <div className="space-y-4 overflow-hidden w-full max-w-full message-list-container">
      <AnimatePresence mode="popLayout">
        {messages.map((message, index) => {
          const additionalOptions =
            typeof messageOptions === "function"
              ? messageOptions(message)
              : messageOptions

          return (
            <motion.div
              key={`${message.id}-${index}`}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                transition: {
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                  duration: 0.6
                }
              }}
              exit={{ 
                opacity: 0, 
                y: -20, 
                scale: 0.95,
                transition: {
                  type: "spring",
                  stiffness: 500,
                  damping: 35,
                  duration: 0.4
                }
              }}
            >
              <ChatMessage
                showTimeStamp={showTimeStamps}
                animation="none"
                {...message}
                {...additionalOptions}
                mode={mode}
                setMode={setMode}
                append={append}
                messageActionsAlwaysVisible={messageActionsAlwaysVisible}
              />
            </motion.div>
          )
        })}
        
        {/* Typing indicator with coordinated animation */}
        {isTyping && (
          <motion.div
            key="typing-indicator"
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 25,
                duration: 0.5
              }
            }}
            exit={{ 
              opacity: 0, 
              y: -10, 
              scale: 0.9,
              transition: {
                type: "spring",
                stiffness: 400,
                damping: 30,
                duration: 0.3
              }
            }}
          >
            <TypingIndicator mode={mode} modelId={modelId} modelProvider={modelProvider} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
