"use client";
import { useChat } from "@ai-sdk/react";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SignedIn,
  SignedOut,
  SignIn,
  SignUp,
  useUser,
  SignOutButton,
  PricingTable,
  useAuth,
} from "@clerk/nextjs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader as CardHead,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, XCircle } from "lucide-react";

import { ChatMessages } from "@/components/ui/chat-messages";
import { ChatInput } from "@/components/ui/chat-input";
import { ChatHistory } from "@/components/ui/chat-history";
import { type Message } from "@/components/ui/chat-message";
import { useChatHistory } from "@/hooks/use-chat-history";

export default function Home() {
  const [mode, setMode] = useState<"agent" | "chat">("chat");
  const [fallbackActive, setFallbackActive] = useState(false);
  const [provider, setProvider] = useState<"openrouter" | "google">("google");
  const [selectedModel, setSelectedModel] = useState<string>(
    "gemini-2.5-flash-preview-05-20"
  );
  const [responseStyle, setResponseStyle] = useState<
    "concise" | "normal" | "detailed"
  >("normal");
  const [isFocused, setIsFocused] = useState(false);
  const [messageActionsAlwaysVisible, setMessageActionsAlwaysVisible] =
    useState(false);
  const retryAttemptRef = useRef(false);
  const [messageTimestamps, setMessageTimestamps] = useState<
    Record<string, Date>
  >({});

  // Track submitted feedback for each message
  const [submittedFeedback, setSubmittedFeedback] = useState<
    Record<string, "thumbs-up" | "thumbs-down">
  >({});

  const { user } = useUser();
  const { has } = useAuth();
  const [remainingMessages, setRemainingMessages] = useState<number | null>(
    null
  );
  const [dailyLimit, setDailyLimit] = useState<number>(25);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [isProfileHovered, setIsProfileHovered] = useState(false);

  // Fetch message limit
  const fetchLimit = useCallback(async () => {
    const res = await fetch("/api/message-limit");
    if (res.ok) {
      const data = await res.json();
      setRemainingMessages(data.remaining);
      setDailyLimit(data.dailyLimit ?? 25);
    }
  }, []);

  useEffect(() => {
    fetchLimit();
  }, [fetchLimit]);

  // Custom error handler for the chat
  const handleChatError = useCallback(async (error: Error) => {
    console.error("Chat error detected:", error);

    // Check if this looks like the OpenRouter error we want to handle
    const errorStr = error.toString().toLowerCase();
    const isOpenRouterError =
      errorStr.includes("an error occurred") ||
      errorStr.includes('3:"an error occurred."') ||
      errorStr.includes("failed to fetch") ||
      errorStr.includes("network error");

    if (isOpenRouterError && !retryAttemptRef.current) {
      setFallbackActive(true);
      setProvider("google");
      retryAttemptRef.current = true;

      // Reset after a short delay
      setTimeout(() => {
        setFallbackActive(false);
        retryAttemptRef.current = false;
      }, 5000);
    }
  }, []); // Chat history management
  const chatHistory = useChatHistory({
    messages: [], // Initialize with empty array, will be updated after useChat
    setMessages: (newMessages) => {}, // Placeholder, will be updated after useChat
    mode,
    modelId: selectedModel,
    modelProvider: provider,
  });

  // Reference to save function for onFinish callback
  const saveSessionRef = useRef<() => void>(() => {});

  // Chat hook with error handling
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    append,
    setMessages,
  } = useChat({
    body: {
      mode,
      retryWithFallback: retryAttemptRef.current,
      provider,
      selectedModel,
      responseStyle,
    },
    onError: handleChatError,
    onResponse: (response) => {
      // Check response headers to see which provider was used
      const aiProvider = response.headers.get("X-AI-Provider");
      if (aiProvider === "google-fallback") {
        setProvider("google");
        setFallbackActive(true);

        // Show notification for a few seconds
        setTimeout(() => {
          setFallbackActive(false);
        }, 3000);
      } else if (aiProvider === "openrouter") {
        setProvider("openrouter");
        setFallbackActive(false);
        retryAttemptRef.current = false;
      }

      // Store model information
      // We'll add this to messages directly based on current provider/model
    },
    onFinish: () => {
      // Force save when AI response completes
      saveSessionRef.current();
      fetchLimit(); // Update message limit after sending a message
    },
  });

  // Update chat history with actual messages and setMessages
  const actualChatHistory = useChatHistory({
    messages,
    setMessages: (newMessages) => setMessages(newMessages),
    mode,
    modelId: selectedModel,
    modelProvider: provider,
  });

  // Update the save reference
  saveSessionRef.current = actualChatHistory.saveCurrentSession;
  const enhancedHandleSubmit = useCallback(
    (
      e?: { preventDefault?: () => void },
      options?: { experimental_attachments?: FileList }
    ) => {
      return handleSubmit(e, options);
    },
    [handleSubmit]
  ); // Function to clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setMessageTimestamps({});
    actualChatHistory.newSession();
  }, [setMessages, actualChatHistory]);
  // Track model information for UI display
  // Handle feedback submission
  const handleSubmitFeedback = useCallback(
    async (
      messageId: string,
      feedback: string,
      rating: "thumbs-up" | "thumbs-down"
    ) => {
      console.log("Feedback submitted:", { messageId, feedback, rating });
      // Here you would typically send the feedback to your backend
      // Example: await fetch('/api/feedback', { method: 'POST', body: JSON.stringify({ messageId, feedback, rating }) })
    },
    []
  );

  // Handle feedback submitted (for state tracking)
  const handleFeedbackSubmitted = useCallback(
    (messageId: string, feedback: "thumbs-up" | "thumbs-down") => {
      setSubmittedFeedback((prev) => ({
        ...prev,
        [messageId]: feedback,
      }));
    },
    []
  );

  // Handle response retry
  const handleRetryResponse = useCallback(
    async (messageId: string) => {
      console.log("Retrying response for message:", messageId);

      // Find the user message that led to this assistant response
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) return;

      // Find the preceding user message
      let userMessageIndex = messageIndex - 1;
      while (
        userMessageIndex >= 0 &&
        messages[userMessageIndex].role !== "user"
      ) {
        userMessageIndex--;
      }

      if (userMessageIndex >= 0) {
        const userMessage = messages[userMessageIndex];

        // Remove all messages after the user message and regenerate
        const messagesToKeep = messages.slice(0, userMessageIndex + 1);
        setMessages(messagesToKeep);

        // Re-submit the user message to generate a new response
        if (append) {
          append({ role: "user", content: userMessage.content });
        }
      }
    },
    [messages, setMessages, append]
  );

  return (
    <>
      <SignedIn>
        {/* Profile badge and expanded options at top right */}
        <motion.div
          className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2"
          onMouseEnter={() => setIsProfileHovered(true)}
          onMouseLeave={() => setIsProfileHovered(false)}
        >
          <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-900/80 border-2 rounded-md shadow-xs px-3 py-1 backdrop-blur-sm">
            <Avatar className="size-7 rounded-md border-2 border-border">
              <AvatarImage
                src={user?.imageUrl}
                alt={user?.fullName || user?.username || "User"}
                className="rounded-md"
              />
              <AvatarFallback className="rounded-md">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm flex items-center gap-1">
              {user?.fullName || user?.username || "User"}
              {has && has({ plan: "pro_user" }) ? (
                <Badge
                  variant="outline"
                  className="border-2 rounded-md text-green-700 border-green-400 bg-green-50 dark:text-green-300 dark:border-green-600 dark:bg-green-900/30"
                >
                  Pro
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-2 rounded-md text-gray-700 border-gray-300 bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:bg-gray-900/30"
                >
                  Free
                </Badge>
              )}
            </span>
            {/* Message limit badge */}
            <Badge
              variant="outline"
              className="border-2 rounded-md px-2 py-0.5 ml-1 text-xs font-medium bg-muted/60"
            >
              {remainingMessages === null
                ? "..."
                : `${remainingMessages}/${dailyLimit}`}
            </Badge>
            <SignOutButton>
              <Button
                variant="outline"
                size="sm"
                className="h-6 border-2 px-2"
                title="Sign out"
              >
                Logout
              </Button>
            </SignOutButton>
          </div>

          <AnimatePresence>
            {isProfileHovered && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-1 w-full mt-1"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 border-2 px-2"
                  onClick={() => alert("Delete Account clicked!")}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete Account
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 border-2 px-2"
                  onClick={() => alert("Cancel Subscription clicked!")}
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Cancel Subscription
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upgrade button below profile badge */}
          {has && !has({ plan: "pro_user" }) && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-2 mt-1"
              onClick={() => setShowUpgrade(true)}
            >
              Upgrade to Pro
            </Button>
          )}
        </motion.div>
        {/* Upgrade Modal */}
        {showUpgrade && (
          <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
            <DialogContent className="max-w-md z-[9999]">
              <DialogHeader>
                <DialogTitle>Upgrade your plan</DialogTitle>
                <DialogDescription>
                  Choose a plan and complete your payment securely.
                </DialogDescription>
              </DialogHeader>
              <div className="py-2">
                <PricingTable />
              </div>
            </DialogContent>
          </Dialog>
        )}
        {/* Main content below */}
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
                  duration: 0.6,
                }}
              >
                <div className="w-full max-w-3xl">
                  {" "}
                  <ChatMessages
                    messages={messages.map((msg, index) => {
                      // Convert AI SDK messages to our UI message format
                      // Use incremental timestamps for better ordering
                      const baseTime = new Date();
                      const messageTime = new Date(
                        baseTime.getTime() - (messages.length - index) * 1000
                      );

                      const uiMessage = {
                        ...msg,
                        createdAt: messageTimestamps[msg.id] || messageTime,
                        modelId:
                          msg.role === "assistant" ? selectedModel : undefined,
                        modelProvider:
                          msg.role === "assistant" ? provider : undefined,
                      };
                      return uiMessage as Message;
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
                    modelId={selectedModel}
                    modelProvider={provider}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Chat Input Container - moves from center to bottom */}
          <div className="relative">
            {messages.length > 0 && (
              <motion.div
                className="fixed left-4 bottom-32 sm:bottom-28 md:left-6 md:bottom-24 z-50"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: 0.2 }}
              >
                <ChatHistory
                  onLoadSession={(session) => {
                    setMessageTimestamps({});
                    actualChatHistory.loadSession(session);
                  }}
                  onNewChat={() => {
                    setMessageTimestamps({});
                    actualChatHistory.newSession();
                  }}
                  currentSessionId={actualChatHistory.currentSessionId}
                />
              </motion.div>
            )}
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
              responseStyle={responseStyle}
              setResponseStyle={setResponseStyle}
              hasMessages={messages.length > 0}
              isFocused={isFocused}
              setIsFocused={setIsFocused}
              clearMessages={clearMessages}
              messageActionsAlwaysVisible={messageActionsAlwaysVisible}
              setMessageActionsAlwaysVisible={setMessageActionsAlwaysVisible}
            />
          </div>
        </motion.div>
      </SignedIn>
      <SignedOut>
        <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950">
          <SignIn routing="hash" />
        </div>
      </SignedOut>
    </>
  );
}
