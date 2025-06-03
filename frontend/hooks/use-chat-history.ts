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
}: UseChatHistoryProps) {  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>()
  const [isNewSession, setIsNewSession] = useState(true)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedMessagesRef = useRef<Message[]>([])
  
  // Save function that can be called immediately
  const saveSession = useCallback(async () => {
    if (messages.length === 0) return
    
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
      
      // Update our reference to avoid unnecessary saves
      lastSavedMessagesRef.current = [...messages]
    } catch (error) {
      console.error('Failed to save chat session:', error)
      // Retry once after a short delay
      setTimeout(async () => {
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
          lastSavedMessagesRef.current = [...messages]
        } catch (retryError) {
          console.error('Failed to save chat session on retry:', retryError)
        }
      }, 1000)
    }
  }, [messages, mode, modelId, modelProvider, currentSessionId])

  // Auto-save chat session when messages change
  useEffect(() => {
    if (messages.length === 0) return
    
    // Check if messages have actually changed to avoid unnecessary saves
    const messagesChanged = messages.length !== lastSavedMessagesRef.current.length ||
      messages.some((msg, index) => {
        const lastSaved = lastSavedMessagesRef.current[index]
        return !lastSaved || msg.content !== lastSaved.content || msg.role !== lastSaved.role
      })
    
    if (!messagesChanged) return

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // For AI responses (when the last message is from assistant), save immediately
    const lastMessage = messages[messages.length - 1]
    const isAIResponse = lastMessage?.role === 'assistant'
    
    if (isAIResponse) {
      // Save AI responses immediately to prevent loss
      saveSession()
    } else {
      // For user messages, use a shorter delay to batch rapid changes
      saveTimeoutRef.current = setTimeout(saveSession, 300)
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [messages, saveSession])
  
  // Save immediately before component unmounts
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      // Force immediate save on unmount if there are unsaved changes
      if (messages.length > 0 && messages !== lastSavedMessagesRef.current) {
        saveChatSession(messages, mode, modelId, modelProvider, currentSessionId)
          .catch(error => console.error('Failed to save on unmount:', error))
      }
    }
  }, []) // Empty dependency array for unmount only
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
    saveCurrentSession: saveSession
  }
}
