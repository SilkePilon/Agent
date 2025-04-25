"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  projectIdea?: string
}

interface ChatContextType {
  messages: Message[]
  isLoading: boolean
  isProductionMode: boolean
  sendMessage: (content: string) => Promise<void>
  resetChat: () => Promise<void>
  generateEmailSummary: () => Promise<{emailSubject: string, emailHtml: string}>
  toggleMode: () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

const ChatProviderComponent = ({ children }: { children: React.ReactNode }) => {  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isProductionMode, setIsProductionMode] = useState(false)

  const makeApiRequest = useCallback(async (body: any) => {
    const sessionId = await fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => data.ip)
      .catch(() => 'anonymous');

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...body,
        chatSession: sessionId,
        isProduction: isProductionMode
      })
    });
    
    if (!response.ok) {
      throw new Error('API request failed');
    }
    
    return response.json();
  }, [isProductionMode]);

  const sendMessage = useCallback(async (content: string) => {
    try {
      setIsLoading(true);
      setMessages(prev => [...prev, { role: 'user', content }]);      const data = await makeApiRequest({ prompt: content });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response,
        projectIdea: data.projectIdea 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, there was an error connecting to the AI. Please try again later." 
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [makeApiRequest]);
  const resetChat = useCallback(async () => {
    try {
      await makeApiRequest({ reset: true });
      setMessages([]);
    } catch (error) {
      console.error('Error resetting chat:', error);
      throw error; // Re-throw the error so it can be caught by the UI
    }
  }, [makeApiRequest]);  const generateEmailSummary = useCallback(async () => {
    try {
      const data = await makeApiRequest({ generateMail: true });
      
      // Clean up the subject by removing any prefix
      const cleanSubject = data.emailSubject ? 
        data.emailSubject.replace(/^Projectidee: /i, '') : 
        'Email Samenvatting';
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.emailHtml || "<html><body><p>Email summary generated successfully!</p></body></html>",
        projectIdea: cleanSubject
      }]);
      
      return {
        emailSubject: data.emailSubject || 'Email Samenvatting',
        emailHtml: data.emailHtml || "<html><body><p>Email summary generated successfully!</p></body></html>"
      };
    } catch (error) {
      console.error('Error generating email:', error);
      throw error; // Re-throw the error so it can be caught by the UI
    }
  }, [makeApiRequest]);

  const toggleMode = useCallback(() => {
    setIsProductionMode(prev => !prev);
  }, []);

  return (
    <ChatContext.Provider value={{
      messages,
      isLoading,
      isProductionMode,
      sendMessage,
      resetChat,
      generateEmailSummary,
      toggleMode
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};

export const ChatProvider = ChatProviderComponent;
export default ChatProvider;
