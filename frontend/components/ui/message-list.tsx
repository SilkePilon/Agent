import { motion, AnimatePresence } from "framer-motion"
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
    <div className="space-y-4 overflow-visible">
      <AnimatePresence mode="popLayout">
        {messages.map((message, index) => {
          const additionalOptions =
            typeof messageOptions === "function"
              ? messageOptions(message)
              : messageOptions

          return (
            <motion.div
              key={`${message.id}-${index}`}
              initial={{ 
                opacity: 0, 
                y: 20,
                scale: 0.95
              }}
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: 1
              }}
              exit={{ 
                opacity: 0, 
                y: -10,
                scale: 0.95
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
                duration: 0.4,
                delay: index * 0.1
              }}
              layout
            >
              <ChatMessage
                showTimeStamp={showTimeStamps}
                {...message}
                {...additionalOptions}
                mode={mode}
                setMode={setMode}
                append={append}
              />
            </motion.div>
          )
        })}
      </AnimatePresence>
      {isTyping && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <TypingIndicator />
        </motion.div>
      )}
    </div>
  )
}
