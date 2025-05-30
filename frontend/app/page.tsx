"use client"
import { useChat } from '@ai-sdk/react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { ChatMessages } from "@/components/ui/chat-messages"
import { ChatInput } from "@/components/ui/chat-input"
import { type Message } from "@/components/ui/chat-message"

export default function Home() {
  const [mode, setMode] = useState<'agent' | 'chat'>('chat');
  const [fallbackActive, setFallbackActive] = useState(false);
  const [provider, setProvider] = useState<'openrouter' | 'google'>('google');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash-preview-05-20');
  const [isFocused, setIsFocused] = useState(false);
  const retryAttemptRef = useRef(false);
  
  // Custom error handler for the chat
  const handleChatError = useCallback(async (error: Error) => {
    console.error('Chat error detected:', error);
    
    // Check if this looks like the OpenRouter error we want to handle
    const errorStr = error.toString().toLowerCase();
    const isOpenRouterError = errorStr.includes('an error occurred') || 
                             errorStr.includes('3:"an error occurred."') ||
                             errorStr.includes('failed to fetch') ||
                             errorStr.includes('network error');
    
    if (isOpenRouterError && !retryAttemptRef.current) {
      setFallbackActive(true);
      setProvider('google');
      retryAttemptRef.current = true;
      
      // Reset after a short delay
      setTimeout(() => {
        setFallbackActive(false);
        retryAttemptRef.current = false;
      }, 5000);
    }
  }, []);
  
  // Chat hook with error handling
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, append, setMessages } = useChat({
    body: { 
      mode,
      retryWithFallback: retryAttemptRef.current,
      provider,
      selectedModel
    },
    onError: handleChatError,
    onResponse: (response) => {
      // Check response headers to see which provider was used
      const aiProvider = response.headers.get('X-AI-Provider');
      if (aiProvider === 'google-fallback') {
        setProvider('google');
        setFallbackActive(true);
        
        // Show notification for a few seconds
        setTimeout(() => {
          setFallbackActive(false);
        }, 3000);
      } else if (aiProvider === 'openrouter') {
        setProvider('openrouter');
        setFallbackActive(false);
        retryAttemptRef.current = false;
      }
      
      // Store model information
      // We'll add this to messages directly based on current provider/model
    }
  });
  
  const enhancedHandleSubmit = useCallback((e?: { preventDefault?: () => void }, options?: { experimental_attachments?: FileList }) => {
    return handleSubmit(e, options);
  }, [handleSubmit]);

  // Function to clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, [setMessages]);

  return (
    <motion.div 
      className="min-h-screen bg-white dark:bg-gray-950 flex flex-col relative"
      layout
    >
      {/* Messages Container - appears and moves up when there are messages */}
      <AnimatePresence>
        {messages.length > 0 && (
          <motion.div
            className="flex-1 flex justify-center px-2 pt-8 pb-32 overflow-hidden message-container"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 25,
              duration: 0.6
            }}
          >
            <div className="w-full max-w-3xl">
              <ChatMessages
                messages={messages.map(msg => {
                  // Add current model information to assistant messages
                  if (msg.role === 'assistant') {
                    return {
                      ...msg,
                      modelId: selectedModel,
                      modelProvider: provider
                    } as Message;
                  }
                  return msg as Message;
                })}
                stop={stop}
                mode={mode}
                setMode={setMode}
                isLoading={isLoading} // Add isLoading prop
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Input Container - moves from center to bottom */}
      <ChatInput
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={enhancedHandleSubmit}
        isGenerating={isLoading}
        stop={stop}
        mode={mode}
        setMode={setMode}
        provider={provider}
        setProvider={setProvider}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        hasMessages={messages.length > 0}
        isFocused={isFocused}
        setIsFocused={setIsFocused}
        clearMessages={clearMessages}
      />
    </motion.div>
  );
}
