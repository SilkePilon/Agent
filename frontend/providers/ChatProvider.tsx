"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  projectIdea?: string
  toolsUsed?: string | string[]
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

const ChatProviderComponent = ({ children }: { children: React.ReactNode }) => {  
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isProductionMode, setIsProductionMode] = useState(true)
  const [deviceId, setDeviceId] = useState<string>('')

  // Generate a device fingerprint on component mount
  useEffect(() => {
    const generateDeviceId = () => {
      // Check if we already have a deviceId in localStorage
      const storedDeviceId = localStorage.getItem('deviceFingerprint');
      if (storedDeviceId) {
        return storedDeviceId;
      }

      // Generate a fingerprint based on browser properties
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.colorDepth,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        navigator.platform || 'unknown'
      ].join('|');

      // Create a hash from the fingerprint
      let hash = 0;
      for (let i = 0; i < fingerprint.length; i++) {
        hash = ((hash << 5) - hash) + fingerprint.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }
      
      // Convert to hex string and pad with device- prefix
      const newDeviceId = 'device-' + Math.abs(hash).toString(16);
      
      // Store for future use
      localStorage.setItem('deviceFingerprint', newDeviceId);
      
      return newDeviceId;
    };

    setDeviceId(generateDeviceId());
  }, []);

  const makeApiRequest = useCallback(async (body: any) => {
    const sessionId = deviceId || 'anonymous';

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
  }, [isProductionMode, deviceId]);  const sendMessage = useCallback(async (content: string) => {
    try {
      setIsLoading(true);
      setMessages(prev => [...prev, { role: 'user', content }]);      const data = await makeApiRequest({ prompt: content });
      
      // Handle different API response structures
      const responseData = data.output || data;
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: responseData.response,
        projectIdea: responseData.projectIdea,
        toolsUsed: responseData.toolsUsed || responseData.toolUsed // Handle both plural and singular versions
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
        projectIdea: cleanSubject,
        toolsUsed: data.toolsUsed
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
