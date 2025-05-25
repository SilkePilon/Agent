"use client"
import { useChat } from '@ai-sdk/react';
import { useState, useCallback, useRef } from 'react';
import { Bot, MessageCircle, Settings } from 'lucide-react';

import { Chat } from "@/components/ui/chat"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const agentSuggestions = [
  "Calculate the compound interest on $10,000 at 5% for 10 years",
  "Create a Python script that analyzes CSV data",
  "Break down the task of building a website into steps"
];

const chatSuggestions = [
  "What's the weather like today?",
  "Tell me a joke", 
  "Explain quantum computing in simple terms"
];

export default function Home() {
  const [mode, setMode] = useState<'agent' | 'chat'>('agent');
  const [fallbackActive, setFallbackActive] = useState(false);
  const [provider, setProvider] = useState<'openrouter' | 'google'>('openrouter');
  const [selectedModel, setSelectedModel] = useState<string>('google/gemini-2.5-flash-preview-05-20:thinking');
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
      console.log('Detected OpenRouter error, will retry with fallback on next message');
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
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, append } = useChat({
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
    }
  });
  
  // Enhanced handleSubmit
  const enhancedHandleSubmit = useCallback((e?: any, options?: any) => {
    // If we detected an error previously, this submission should use fallback
    if (retryAttemptRef.current) {
      console.log('Submitting with fallback flag set');
    }
    return handleSubmit(e, options);
  }, [handleSubmit]);

  const currentSuggestions = mode === 'agent' ? agentSuggestions : chatSuggestions;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              AI Assistant
            </h1>
            
            {mode === 'agent' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="default" className="bg-blue-500 text-white px-3 py-1">
                    <Bot className="h-3 w-3 mr-1" />
                    Agent Mode
                  </Badge>
                  <Settings className="h-4 w-4 text-gray-500" />
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Your intelligent assistant capable of performing complex tasks, calculations, 
                  code generation, planning, and much more.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="outline" className="px-3 py-1">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Chat Mode
                  </Badge>
                  <Settings className="h-4 w-4 text-gray-500" />
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Have a natural conversation with the AI assistant. Ask questions, get explanations, 
                  or just chat about anything on your mind.
                </p>
              </div>
            )}
          </div>

          {/* Agent Capabilities */}
          {messages.length === 0 && mode === 'agent' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">🧮 Mathematics</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Complex calculations, unit conversions, statistical analysis
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">💻 Code Generation</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Generate and analyze code in multiple programming languages
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">📋 Task Planning</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Break down complex projects into manageable steps
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">🔍 Research</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Web search and information gathering capabilities
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">📊 Data Analysis</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Analyze datasets and provide insights and patterns
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">📝 Content Creation</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Generate files, emails, and professional documents
                </p>
              </div>
            </div>
          )}

          {/* Chat Interface */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border min-h-[600px]">
            {fallbackActive && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {provider === 'google' 
                      ? '⚡ Switched to Google Gemini due to OpenRouter issues' 
                      : '⚡ Switching to backup provider...'}
                  </p>
                </div>
              </div>
            )}
            <Chat
              messages={messages as any}
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={enhancedHandleSubmit}
              isGenerating={isLoading}
              stop={stop}
              append={append}
              suggestions={currentSuggestions}
              className="h-[600px] p-4"
              mode={mode}
              setMode={setMode}
              provider={provider}
              setProvider={setProvider}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
            />
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
            <p>
              {mode === 'agent' 
                ? "This AI Agent uses advanced multi-step reasoning and tool usage to accomplish complex tasks. Try asking it to solve problems, generate code, or help with planning."
                : "Chat mode provides natural conversation without external tools. Perfect for questions, explanations, and casual discussions."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
