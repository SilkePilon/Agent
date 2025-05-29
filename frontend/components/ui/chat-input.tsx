"use client"

import { useState } from "react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { MessageInput } from "@/components/ui/message-input"

interface ChatInputProps {
  handleSubmit: (
    event?: { preventDefault?: () => void },
    options?: { experimental_attachments?: FileList }
  ) => void
  input: string
  className?: string
  handleInputChange: React.ChangeEventHandler<HTMLTextAreaElement>
  isGenerating: boolean
  stop?: () => void
  transcribeAudio?: (blob: Blob) => Promise<string>
  mode?: 'agent' | 'chat'
  setMode?: (mode: 'agent' | 'chat') => void
  provider?: 'openrouter' | 'google'
  setProvider?: (provider: 'openrouter' | 'google') => void
  selectedModel?: string
  setSelectedModel?: (model: string) => void
  hasMessages?: boolean
}

function createFileList(files: File[] | FileList): FileList {
  const dataTransfer = new DataTransfer()
  for (const file of Array.from(files)) {
    dataTransfer.items.add(file)
  }
  return dataTransfer.files
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
  hasMessages = false,
  className,
}: ChatInputProps) {
  const [files, setFiles] = useState<File[] | null>(null)
  const onSubmit = (event: React.FormEvent) => {
    if (!files) {
      handleSubmit(event)
      return
    }

    const fileList = createFileList(files)
    handleSubmit(event, { experimental_attachments: fileList })
    setFiles(null)
  }
  return (
    <motion.div
      className="flex flex-col w-full"
      initial={false}
      animate={{
        position: hasMessages ? "fixed" : "absolute",
        top: hasMessages ? "auto" : "50%",
        bottom: hasMessages ? "16px" : "auto",
        left: hasMessages ? "50%" : "50%",
        right: "auto",
        transform: hasMessages ? "translateX(-50%)" : "translate(-50%, -50%)",
        zIndex: hasMessages ? 50 : 10,
        width: hasMessages ? "calc(100% - 32px)" : "100%",
        maxWidth: hasMessages ? "768px" : "512px",
      }}
      transition={{ 
        type: "spring", 
        stiffness: 200, 
        damping: 25,
        duration: 1.2
      }}
    >
      <form onSubmit={onSubmit}>
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
        />
      </form>
    </motion.div>
  )
}
