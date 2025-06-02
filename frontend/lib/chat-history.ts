import { type Message } from "ai"

// Extended message type with additional fields for our UI
export interface ExtendedMessage extends Message {
  createdAt?: Date
  modelId?: string
  modelProvider?: 'openrouter' | 'google'
}

export interface ChatSession {
  id: string
  title: string
  messages: ExtendedMessage[]
  createdAt: Date
  updatedAt: Date
  mode: 'agent' | 'chat'
  modelId?: string
  modelProvider?: 'openrouter' | 'google'
}

const CHAT_HISTORY_KEY = 'chat-history'
const MAX_SESSIONS = 50 // Limit to prevent localStorage bloat

// Generate a short ID for chat sessions
function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

// Generate a title from the first user message
function generateTitle(messages: ExtendedMessage[]): string {
  const firstUserMessage = messages.find(m => m.role === 'user')
  if (!firstUserMessage) return 'New Chat'
  
  const content = firstUserMessage.content.slice(0, 50)
  return content.length < firstUserMessage.content.length ? content + '...' : content
}

// Generate a title using AI based on the conversation
async function generateAITitle(messages: ExtendedMessage[]): Promise<string> {
  try {
    // Take the first few messages to understand the conversation context
    const contextMessages = messages.slice(0, 6).map(msg => `${msg.role}: ${msg.content}`).join('\n')
    
    const response = await fetch('/api/generate-title', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation: contextMessages
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to generate title')
    }
    
    const data = await response.json()
    return data.title || generateTitle(messages)
  } catch (error) {
    console.error('Error generating AI title:', error)
    return generateTitle(messages) // Fallback to simple title generation
  }
}

// Get all chat sessions from localStorage
export function getChatSessions(): ChatSession[] {
  try {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY)
    if (!stored) return []
    
    const sessions: any[] = JSON.parse(stored)
    return sessions.map(session => ({
      ...session,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
      messages: session.messages.map((message: any) => ({
        ...message,
        createdAt: message.createdAt ? new Date(message.createdAt) : new Date()
      }))
    })).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  } catch (error) {
    console.error('Error loading chat sessions:', error)
    return []
  }
}

// Save a chat session with AI-generated title
export async function saveChatSession(
  messages: Message[], 
  mode: 'agent' | 'chat',
  modelId?: string,
  modelProvider?: 'openrouter' | 'google',
  existingSessionId?: string
): Promise<string> {
  if (messages.length === 0) return ''
    try {
    const sessions = getChatSessions()
    const now = new Date()
    
    let processedMessages: ExtendedMessage[]
    
    if (existingSessionId) {
      // When updating an existing session, preserve original timestamps
      const existingSession = sessions.find(s => s.id === existingSessionId)
      const existingMessages = existingSession?.messages || []
      
      processedMessages = messages.map((message, index) => {
        // Check if this message already exists (by id or position)
        const existingMessage = existingMessages.find(em => em.id === message.id) ||
                              existingMessages[index]
        
        if (existingMessage && existingMessage.content === message.content) {
          // Preserve original timestamp for existing messages
          return {
            ...message,
            createdAt: existingMessage.createdAt,
            modelId,
            modelProvider
          }
        } else {
          // New message gets current timestamp
          return {
            ...message,
            createdAt: new Date(now.getTime() - (messages.length - index - 1) * 100),
            modelId,
            modelProvider
          }
        }
      })
    } else {
      // New session: create incremental timestamps for all messages
      processedMessages = messages.map((message, index) => ({
        ...message,
        createdAt: new Date(now.getTime() - (messages.length - index - 1) * 1000),
        modelId,
        modelProvider
      }))
    }
    
    // Generate AI title for new sessions or when updating with new messages
    const shouldGenerateNewTitle = !existingSessionId || 
      (existingSessionId && sessions.find(s => s.id === existingSessionId)?.messages.length !== processedMessages.length)
    
    let title: string
    if (shouldGenerateNewTitle) {
      title = await generateAITitle(processedMessages)
    } else {
      const existingSession = sessions.find(s => s.id === existingSessionId)
      title = existingSession?.title || await generateAITitle(processedMessages)
    }
    
    if (existingSessionId) {
      // Update existing session
      const sessionIndex = sessions.findIndex(s => s.id === existingSessionId)
      if (sessionIndex !== -1) {
        sessions[sessionIndex] = {
          ...sessions[sessionIndex],
          messages: processedMessages,
          updatedAt: now,
          title,
          mode,
          modelId,
          modelProvider
        }
      }
    } else {
      // Create new session
      const newSession: ChatSession = {
        id: generateId(),
        title,
        messages: processedMessages,
        createdAt: now,
        updatedAt: now,
        mode,
        modelId,
        modelProvider
      }
      
      sessions.unshift(newSession)
      
      // Keep only the most recent sessions
      if (sessions.length > MAX_SESSIONS) {
        sessions.splice(MAX_SESSIONS)
      }
    }
    
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(sessions))
    return existingSessionId || sessions[0].id
  } catch (error) {
    console.error('Error saving chat session:', error)
    return existingSessionId || ''
  }
}

// Load a specific chat session
export function loadChatSession(sessionId: string): ChatSession | null {
  try {
    const sessions = getChatSessions()
    const session = sessions.find(s => s.id === sessionId)
    if (!session) return null
    
    // Messages are already processed by getChatSessions with proper Date objects
    return session
  } catch (error) {
    console.error('Error loading chat session:', error)
    return null
  }
}

// Delete a chat session
export function deleteChatSession(sessionId: string): void {
  try {
    const sessions = getChatSessions()
    const filtered = sessions.filter(s => s.id !== sessionId)
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Error deleting chat session:', error)
  }
}

// Clear all chat history
export function clearAllChatHistory(): void {
  try {
    localStorage.removeItem(CHAT_HISTORY_KEY)
  } catch (error) {
    console.error('Error clearing chat history:', error)
  }
}

// Regenerate AI title for an existing session
export async function regenerateSessionTitle(sessionId: string): Promise<void> {
  try {
    const sessions = getChatSessions()
    const sessionIndex = sessions.findIndex(s => s.id === sessionId)
    if (sessionIndex === -1) return
    
    const session = sessions[sessionIndex]
    const newTitle = await generateAITitle(session.messages)
    
    sessions[sessionIndex].title = newTitle
    sessions[sessionIndex].updatedAt = new Date()
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(sessions))
  } catch (error) {
    console.error('Error regenerating session title:', error)
  }
}

// Update session title
export function updateSessionTitle(sessionId: string, title: string): void {
  try {
    const sessions = getChatSessions()
    const sessionIndex = sessions.findIndex(s => s.id === sessionId)
    if (sessionIndex !== -1) {
      sessions[sessionIndex].title = title
      sessions[sessionIndex].updatedAt = new Date()
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(sessions))
    }
  } catch (error) {
    console.error('Error updating session title:', error)
  }
}
