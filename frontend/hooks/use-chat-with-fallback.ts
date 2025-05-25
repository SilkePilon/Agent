import { useCallback, useRef } from 'react';
import { useChat as useAIChat } from '@ai-sdk/react';

interface UseChatWithFallbackProps {
  body?: { mode?: 'agent' | 'chat' };
  onError?: (error: Error) => void;
}

export function useChatWithFallback({ body, onError }: UseChatWithFallbackProps = {}) {
  const fallbackTriggered = useRef(false);
  const originalMessagesRef = useRef<any[]>([]);
  
  const handleError = useCallback(async (error: Error) => {
    console.error('Chat error detected:', error);
    
    // Check if this is the specific error we want to handle
    const errorMessage = error.message || '';
    if (errorMessage.includes('An error occurred') || 
        errorMessage.includes('3:"An error occurred."') ||
        error.toString().includes('An error occurred')) {
      
      console.log('Detected OpenRouter error, attempting fallback...');
      
      if (!fallbackTriggered.current && originalMessagesRef.current.length > 0) {
        fallbackTriggered.current = true;
        
        try {
          // Get the last user message to retry
          const lastUserMessage = originalMessagesRef.current
            .slice()
            .reverse()
            .find(msg => msg.role === 'user');
          
          if (lastUserMessage) {
            console.log('Retrying with fallback endpoint...');
            
            // Make a direct API call to the fallback endpoint
            const response = await fetch('/api/chat/fallback', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messages: originalMessagesRef.current,
                mode: body?.mode || 'agent',
                reason: 'OpenRouter error detected in response'
              }),
            });
            
            if (!response.ok) {
              throw new Error(`Fallback failed: ${response.statusText}`);
            }
            
            // Return the fallback response
            return response;
          }
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          fallbackTriggered.current = false; // Reset for next attempt
        }
      }
    }
    
    // Call the original error handler if provided
    onError?.(error);
    
    // Re-throw the error so it's handled normally
    throw error;
  }, [body?.mode, onError]);
  
  const chat = useAIChat({
    body,
    onError: handleError,
  });
  
  // Track messages for potential fallback
  const originalAppend = chat.append;
  const enhancedAppend = useCallback((message: any) => {
    originalMessagesRef.current = [...chat.messages, message];
    fallbackTriggered.current = false; // Reset fallback flag for new messages
    return originalAppend(message);
  }, [originalAppend, chat.messages]);
  
  const originalHandleSubmit = chat.handleSubmit;
  const enhancedHandleSubmit = useCallback((event?: any, options?: any) => {
    // Store current messages before submitting
    if (chat.input.trim()) {
      originalMessagesRef.current = [...chat.messages, { 
        role: 'user', 
        content: chat.input.trim(),
        id: Date.now().toString()
      }];
    }
    fallbackTriggered.current = false; // Reset fallback flag
    return originalHandleSubmit(event, options);
  }, [originalHandleSubmit, chat.messages, chat.input]);
  
  return {
    ...chat,
    append: enhancedAppend,
    handleSubmit: enhancedHandleSubmit,
  };
}
