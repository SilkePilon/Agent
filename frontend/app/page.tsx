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
  const [messageActionsAlwaysVisible, setMessageActionsAlwaysVisible] = useState(false);
  const retryAttemptRef = useRef(false);
  
  // Track submitted feedback for each message
  const [submittedFeedback, setSubmittedFeedback] = useState<Record<string, "thumbs-up" | "thumbs-down">>({});
  
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
  // Handle feedback submission
  const handleSubmitFeedback = useCallback(async (
    messageId: string, 
    feedback: string, 
    rating: "thumbs-up" | "thumbs-down"
  ) => {
    console.log('Feedback submitted:', { messageId, feedback, rating });
    // Here you would typically send the feedback to your backend
    // Example: await fetch('/api/feedback', { method: 'POST', body: JSON.stringify({ messageId, feedback, rating }) })
  }, []);

  // Handle feedback submitted (for state tracking)
  const handleFeedbackSubmitted = useCallback((messageId: string, feedback: "thumbs-up" | "thumbs-down") => {
    setSubmittedFeedback(prev => ({
      ...prev,
      [messageId]: feedback
    }));
  }, []);

  // Handle response retry
  const handleRetryResponse = useCallback(async (messageId: string) => {
    console.log('Retrying response for message:', messageId);
    
    // Find the user message that led to this assistant response
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;
    
    // Find the preceding user message
    let userMessageIndex = messageIndex - 1;
    while (userMessageIndex >= 0 && messages[userMessageIndex].role !== 'user') {
      userMessageIndex--;
    }
    
    if (userMessageIndex >= 0) {
      const userMessage = messages[userMessageIndex];
      
      // Remove all messages after the user message and regenerate
      const messagesToKeep = messages.slice(0, userMessageIndex + 1);
      setMessages(messagesToKeep);
      
      // Re-submit the user message to generate a new response
      if (append) {
        append({ role: 'user', content: userMessage.content });
      }
    }
  }, [messages, setMessages, append]);

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
            <div className="w-full max-w-3xl">              <ChatMessages
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
                onSubmitFeedback={handleSubmitFeedback}
                onRetryResponse={handleRetryResponse}
                setMessages={setMessages as any}
                submittedFeedback={submittedFeedback}
                onFeedbackSubmitted={handleFeedbackSubmitted}
                messageActionsAlwaysVisible={messageActionsAlwaysVisible}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Input Container - moves from center to bottom */}      <ChatInput
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
        messageActionsAlwaysVisible={messageActionsAlwaysVisible}
        setMessageActionsAlwaysVisible={setMessageActionsAlwaysVisible}
      />
    </motion.div>
  );
}
