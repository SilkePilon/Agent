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

// Save a chat session
export function saveChatSession(
  messages: Message[], 
  mode: 'agent' | 'chat',
  modelId?: string,
  modelProvider?: 'openrouter' | 'google',
  existingSessionId?: string
): string {
  if (messages.length === 0) return ''
  
  try {
    const sessions = getChatSessions()
    const now = new Date()
    
    // Convert messages to extended format with proper createdAt dates
    const processedMessages: ExtendedMessage[] = messages.map(message => ({
      ...message,
      createdAt: now, // Use current time for all messages since AI SDK doesn't provide createdAt
      modelId,
      modelProvider
    }))
    
    if (existingSessionId) {
      // Update existing session
      const sessionIndex = sessions.findIndex(s => s.id === existingSessionId)
      if (sessionIndex !== -1) {
        sessions[sessionIndex] = {
          ...sessions[sessionIndex],
          messages: processedMessages,
          updatedAt: now,
          title: generateTitle(processedMessages),
          mode,
          modelId,
          modelProvider
        }
      }
    } else {
      // Create new session
      const newSession: ChatSession = {
        id: generateId(),
        title: generateTitle(processedMessages),
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
