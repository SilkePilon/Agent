"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { type Message } from "ai"
import { 
  saveChatSession, 
  loadChatSession, 
  type ChatSession,
  type ExtendedMessage
} from "@/lib/chat-history"

interface UseChatHistoryProps {
  messages: Message[]
  setMessages: (messages: Message[]) => void
  mode: 'agent' | 'chat'
  modelId?: string
  modelProvider?: 'openrouter' | 'google'
}

export function useChatHistory({
  messages,
  setMessages,
  mode,
  modelId,
  modelProvider
}: UseChatHistoryProps) {
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>()
  const [isNewSession, setIsNewSession] = useState(true)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  // Auto-save chat session when messages change
  useEffect(() => {
    if (messages.length === 0) return

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Save after a short delay to avoid excessive saves
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const sessionId = await saveChatSession(
          messages,
          mode,
          modelId,
          modelProvider,
          currentSessionId
        )
        
        if (sessionId && !currentSessionId) {
          setCurrentSessionId(sessionId)
          setIsNewSession(false)
        }
      } catch (error) {
        console.error('Failed to save chat session:', error)
      }
    }, 1000)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [messages, mode, modelId, modelProvider, currentSessionId])
  // Load a chat session
  const loadSession = useCallback((session: ChatSession) => {
    // Convert ExtendedMessage back to Message for the AI SDK
    const aiSdkMessages: Message[] = session.messages.map(msg => {
      const { createdAt, modelId, modelProvider, ...aiMessage } = msg
      return aiMessage
    })
    setMessages(aiSdkMessages)
    setCurrentSessionId(session.id)
    setIsNewSession(false)
  }, [setMessages])

  // Start a new chat session
  const newSession = useCallback(() => {
    setMessages([])
    setCurrentSessionId(undefined)
    setIsNewSession(true)
  }, [setMessages])
  // Force save current session
  const saveCurrentSession = useCallback(async () => {
    if (messages.length > 0) {
      try {
        const sessionId = await saveChatSession(
          messages,
          mode,
          modelId,
          modelProvider,
          currentSessionId
        )
        
        if (sessionId && !currentSessionId) {
          setCurrentSessionId(sessionId)
          setIsNewSession(false)
        }
      } catch (error) {
        console.error('Failed to save current session:', error)
      }
    }
  }, [messages, mode, modelId, modelProvider, currentSessionId])

  return {
    currentSessionId,
    isNewSession,
    loadSession,
    newSession,
    saveCurrentSession
  }
}
