"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, MessageCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { MessageInput } from "@/components/ui/message-input";

interface ChatInputProps {
  handleSubmit: (
    event?: { preventDefault?: () => void },
    options?: { experimental_attachments?: FileList }
  ) => void;
  input: string;
  className?: string;
  handleInputChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  isGenerating: boolean;
  stop?: () => void;
  transcribeAudio?: (blob: Blob) => Promise<string>;
  mode?: "agent" | "chat";
  setMode?: (mode: "agent" | "chat") => void;
  provider?: "openrouter" | "google";
  setProvider?: (provider: "openrouter" | "google") => void;
  selectedModel?: string;
  setSelectedModel?: (model: string) => void;
  responseStyle?: "concise" | "normal" | "detailed";
  setResponseStyle?: (style: "concise" | "normal" | "detailed") => void;
  hasMessages?: boolean;
  isFocused?: boolean;
  setIsFocused?: (focused: boolean) => void;
  clearMessages?: () => void;
  messageActionsAlwaysVisible?: boolean;
  setMessageActionsAlwaysVisible?: (value: boolean) => void;
}

function createFileList(files: File[] | FileList): FileList {
  const dataTransfer = new DataTransfer();
  for (const file of Array.from(files)) {
    dataTransfer.items.add(file);
  }
  return dataTransfer.files;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isGenerating,
  stop,
  transcribeAudio,
  mode,
  setMode,
  provider,
  setProvider,
  selectedModel,
  setSelectedModel,
  responseStyle,
  setResponseStyle,
  hasMessages = false,
  isFocused = false,
  setIsFocused,
  clearMessages,
  className,
  messageActionsAlwaysVisible = false,
  setMessageActionsAlwaysVisible,
}: ChatInputProps) {
  const [files, setFiles] = useState<File[] | null>(null);
  const [inputHeight, setInputHeight] = useState<number>(56); // Default height for single line
  const formRef = useRef<HTMLFormElement>(null);

  // Track the height of the input form for animations
  useEffect(() => {
    if (formRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setInputHeight(entry.target.scrollHeight);
        }
      });

      resizeObserver.observe(formRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  const onSubmit = (event: React.FormEvent) => {
    if (!files) {
      handleSubmit(event);
      return;
    }
    const fileList = createFileList(files);
    handleSubmit(event, { experimental_attachments: fileList });
    setFiles(null);
  };
  return (
    <motion.div
      className="flex flex-col w-full fixed left-1/2"
      initial={false}
      animate={{
        top: hasMessages ? "auto" : "50%",
        bottom: hasMessages ? "16px" : "auto",
        transform: hasMessages ? "translateX(-50%)" : "translate(-50%, -50%)",
        zIndex: hasMessages ? 50 : 10,
        width: "calc(100% - 32px)",
        maxWidth: hasMessages ? "768px" : "512px",
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 35,
        mass: 0.8,
      }}
    >
      {/* Agent/Chat Mode Indicator - Positioned at top center of entire card */}
      <AnimatePresence>
        {" "}
        {isFocused && mode === "agent" && (
          <motion.div
            className="absolute left-1/2 transform -translate-x-1/2 -top-10 z-0 flex items-center gap-2 px-3 py-1 bg-blue-500 text-white text-xs rounded-md shadow-sm pointer-events-none"
            initial={{ opacity: 0, y: 80 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 1.2,
              },
            }}
            exit={{
              opacity: 0,
              y: 80,
              transition: {
                type: "spring",
                stiffness: 250,
                damping: 35,
                duration: 1.8,
              },
            }}
          >
            <Bot className="h-3 w-3" />
            <span className="font-medium">Agent Mode Active</span>
          </motion.div>
        )}{" "}
        {isFocused && mode === "chat" && (
          <motion.div
            className="absolute left-1/2 transform -translate-x-1/2 -top-10 z-0 flex items-center gap-2 px-3 py-1 bg-green-500 text-white text-xs rounded-md shadow-sm pointer-events-none"
            initial={{ opacity: 0, y: 80 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 1.2,
              },
            }}
            exit={{
              opacity: 0,
              y: 80,
              transition: {
                type: "spring",
                stiffness: 250,
                damping: 35,
                duration: 1.8,
              },
            }}
          >
            <MessageCircle strokeWidth={3} className="h-3 w-3" />
            <span className="font-medium">Chat Mode Active</span>
          </motion.div>
        )}
      </AnimatePresence>{" "}
      <form
        onSubmit={onSubmit}
        className="relative z-10 transition-all duration-300 ease-out"
        ref={formRef}
      >
        {" "}
        <MessageInput
          value={input}
          onChange={handleInputChange}
          allowAttachments
          files={files}
          setFiles={setFiles}
          stop={stop}
          isGenerating={isGenerating}
          transcribeAudio={transcribeAudio}
          mode={mode}
          setMode={setMode}
          provider={provider}
          setProvider={setProvider}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          responseStyle={responseStyle}
          setResponseStyle={setResponseStyle}
          clearMessages={clearMessages}
          hasMessages={hasMessages}
          onFocus={() => setIsFocused?.(true)}
          onBlur={() => setIsFocused?.(false)}
          messageActionsAlwaysVisible={messageActionsAlwaysVisible}
          setMessageActionsAlwaysVisible={setMessageActionsAlwaysVisible}
        />
      </form>
    </motion.div>
  );
}
