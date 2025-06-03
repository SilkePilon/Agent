"use client"

import React, { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowUp, Info, Loader2, Mic, Paperclip, Square, Bot, MessageCircle, Settings, Trash2 } from "lucide-react"
import { omit } from "remeda"

import { cn } from "@/lib/utils"
import { useAudioRecording } from "@/hooks/use-audio-recording"
import { useAutosizeTextArea } from "@/hooks/use-autosize-textarea"
import { AudioVisualizer } from "@/components/ui/audio-visualizer"
import { Button } from "@/components/ui/button"
import { FilePreview } from "@/components/ui/file-preview"
import { InterruptPrompt } from "@/components/ui/interrupt-prompt"
import { SettingsTooltip, SettingsFormContents } from "@/components/ui/settings-tooltip" // Import SettingsFormContents
import { AnimatedPlaceholder } from "@/components/ui/animated-placeholder"
import { useIsMobile } from "@/hooks/use-mobile"; // Changed path
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose, // Import DrawerClose
} from "@/components/ui/drawer"; // Changed path
import type { ModelOption } from "@/lib/models"; // For availableModels prop

interface MessageInputBaseProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string
  submitOnEnter?: boolean
  stop?: () => void
  isGenerating: boolean
  enableInterrupt?: boolean
  transcribeAudio?: (blob: Blob) => Promise<string>
  mode?: 'agent' | 'chat'
  setMode?: (mode: 'agent' | 'chat') => void
  provider?: 'openrouter' | 'google'
  setProvider?: (provider: 'openrouter' | 'google') => void
  selectedModel?: string
  setSelectedModel?: (model: string) => void
  responseStyle?: 'concise' | 'normal' | 'detailed'
  setResponseStyle?: (style: 'concise' | 'normal' | 'detailed') => void
  clearMessages?: () => void
  hasMessages?: boolean
  messageActionsAlwaysVisible?: boolean
  setMessageActionsAlwaysVisible?: (value: boolean) => void
  // Props for SettingsFormContents
  availableModels?: ModelOption[]
  isLoadingModels?: boolean
  modelSearchQuery?: string
  setModelSearchQuery?: (query: string) => void
  filteredModels?: ModelOption[]
  getCurrentProvider?: () => string
  getCurrentModel?: () => string
}

interface MessageInputWithoutAttachmentProps extends MessageInputBaseProps {
  allowAttachments?: false
}

interface MessageInputWithAttachmentsProps extends MessageInputBaseProps {
  allowAttachments: true
  files: File[] | null
  setFiles: React.Dispatch<React.SetStateAction<File[] | null>>
}

type MessageInputProps =
  | MessageInputWithoutAttachmentProps
  | MessageInputWithAttachmentsProps

export function MessageInput({
  placeholder = "Ask AI...",
  className,
  onKeyDown: onKeyDownProp,
  submitOnEnter = true,
  stop,
  isGenerating,
  enableInterrupt = true,
  transcribeAudio,
  messageActionsAlwaysVisible = false,
  setMessageActionsAlwaysVisible,
  // Destructure new props for settings form
  availableModels: propAvailableModels,
  isLoadingModels: propIsLoadingModels,
  modelSearchQuery: propModelSearchQuery,
  setModelSearchQuery: propSetModelSearchQuery,
  filteredModels: propFilteredModels,
  getCurrentProvider: propGetCurrentProvider,
  getCurrentModel: propGetCurrentModel,
  ...props
}: MessageInputProps) {
  const isMobile = useIsMobile();
  const [isDragging, setIsDragging] = useState(false)
  const [showInterruptPrompt, setShowInterruptPrompt] = useState(false)

  // State for Drawer's SettingsFormContents instance
  const [drawerSelectOpen, setDrawerSelectOpen] = useState(false);
  const drawerSearchInputRef = useRef<HTMLInputElement>(null);
  
  // Default model loading and filtering logic for Drawer context (can be adapted if these are passed from parent)
  // For simplicity, we'll assume if these props are undefined, we use some defaults or manage them internally here.
  // This part might need adjustment based on where state like availableModels is truly managed for MessageInput.
  // The SettingsTooltip manages these internally if not provided.
  // For the drawer, MessageInput needs to provide them to SettingsFormContents.

  const [internalAvailableModels, setInternalAvailableModels] = useState<ModelOption[]>(propAvailableModels || []);
  const [internalIsLoadingModels, setInternalIsLoadingModels] = useState(propIsLoadingModels || false);
  const [internalModelSearchQuery, setInternalModelSearchQuery] = useState(propModelSearchQuery || "");
  
  // If props for model list management are not passed, these internal ones will be used.
  // This makes SettingsFormContents flexible.
  const availableModels = propAvailableModels ?? internalAvailableModels;
  const isLoadingModels = propIsLoadingModels ?? internalIsLoadingModels;
  const modelSearchQuery = propModelSearchQuery ?? internalModelSearchQuery;
  const setModelSearchQuery = propSetModelSearchQuery ?? setInternalModelSearchQuery;

  // This logic should ideally be part of a custom hook or passed down if complex.
  // For now, replicating a simplified version of filteredModels logic for the drawer context
  // if not provided directly.
  const internalFilteredModels = React.useMemo(() => {
    if (props.provider !== 'openrouter' || !availableModels.length) {
        return [];
    }
    if (!modelSearchQuery.trim()) {
        return availableModels;
    }
    const query = modelSearchQuery.toLowerCase();
    return availableModels.filter(
        (model) =>
            model.name.toLowerCase().includes(query) ||
            model.id.toLowerCase().includes(query) ||
            (model.description && model.description.toLowerCase().includes(query))
    );
  }, [availableModels, modelSearchQuery, props.provider]);

  const filteredModels = propFilteredModels ?? internalFilteredModels;

  const defaultGetCurrentProvider = () => {
    if (props.provider === 'google') return 'Google Gemini';
    return 'OpenRouter';
  };
  const getCurrentProvider = propGetCurrentProvider ?? defaultGetCurrentProvider;

  const defaultGetCurrentModel = () => {
    if (props.provider === 'google') return 'Gemini Pro 1.5'; // Default Google model
    if (props.provider === 'openrouter' && props.selectedModel) {
        const model = availableModels.find(m => m.id === props.selectedModel);
        return model?.name || props.selectedModel.split('/').pop()?.split(':')[0] || 'Default';
    }
    return 'Default';
  };
  const getCurrentModel = propGetCurrentModel ?? defaultGetCurrentModel;

  // Effect to load models if provider is 'openrouter' and drawer will use internal state
  // This is only if propAvailableModels is not provided.
  useEffect(() => {
    if (props.provider === 'openrouter' && !propAvailableModels && isMobile) { // Only for drawer context if not managed by parent
      setInternalIsLoadingModels(true);
      import("@/lib/models").then(module => { // Dynamically import to avoid issues
        module.getAllModels()
          .then(setInternalAvailableModels)
          .catch(error => console.error("Failed to load models for drawer:", error))
          .finally(() => setInternalIsLoadingModels(false));
      });
    } else if (props.provider !== 'openrouter' && !propAvailableModels) {
        setInternalAvailableModels([]);
    }
  }, [props.provider, propAvailableModels, isMobile]);

  // Prompt suggestions for the animated placeholder
  const promptSuggestions = [
    "Explain quantum computing in simple terms",
    "Write a creative story about time travel",
    "Help me plan a weekend getaway",
    "What are the latest AI breakthroughs?",
    "Create a recipe with ingredients I have",
    "Analyze this data for insights",
    "Write code for a web scraper",
    "Explain machine learning concepts",
    "Help me learn a new language",
    "Plan my workout routine"
  ]

  const {
    isListening,
    isSpeechSupported,
    isRecording,
    isTranscribing,
    audioStream,
    toggleListening,
    stopRecording,
  } = useAudioRecording({
    transcribeAudio,
    onTranscriptionComplete: (text) => {
      props.onChange?.({ target: { value: text } } as React.ChangeEvent<HTMLTextAreaElement>)
    },
  })

  useEffect(() => {
    if (!isGenerating) {
      setShowInterruptPrompt(false)
    }
  }, [isGenerating])

  const addFiles = (files: File[] | null) => {
    if (props.allowAttachments) {
      props.setFiles((currentFiles) => {
        if (currentFiles === null) {
          return files
        }

        if (files === null) {
          return currentFiles
        }

        return [...currentFiles, ...files]
      })
    }
  }

  const onDragOver = (event: React.DragEvent) => {
    if (props.allowAttachments !== true) return
    event.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = (event: React.DragEvent) => {
    if (props.allowAttachments !== true) return
    event.preventDefault()
    setIsDragging(false)
  }

  const onDrop = (event: React.DragEvent) => {
    setIsDragging(false)
    if (props.allowAttachments !== true) return
    event.preventDefault()
    const dataTransfer = event.dataTransfer
    if (dataTransfer.files.length) {
      addFiles(Array.from(dataTransfer.files))
    }
  }

  const onPaste = (event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items
    if (!items) return

    const text = event.clipboardData.getData("text")
    if (text && text.length > 500 && props.allowAttachments) {
      event.preventDefault()
      const blob = new Blob([text], { type: "text/plain" })
      const file = new File([blob], "Pasted text", {
        type: "text/plain",
        lastModified: Date.now(),
      })
      addFiles([file])
      return
    }

    const files = Array.from(items)
      .map((item) => item.getAsFile())
      .filter((file) => file !== null)

    if (props.allowAttachments && files.length > 0) {
      addFiles(files)
    }
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (submitOnEnter && event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()

      if (isGenerating && stop && enableInterrupt) {
        if (showInterruptPrompt) {
          stop()
          setShowInterruptPrompt(false)
          event.currentTarget.form?.requestSubmit()
        } else if (
          props.value ||
          (props.allowAttachments && props.files?.length)
        ) {
          setShowInterruptPrompt(true)
          return
        }
      }

      event.currentTarget.form?.requestSubmit()
    }

    onKeyDownProp?.(event)
  }

  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const [textAreaHeight, setTextAreaHeight] = useState<number>(0)

  useEffect(() => {
    if (textAreaRef.current) {
      setTextAreaHeight(textAreaRef.current.offsetHeight)
    }
  }, [props.value])
  // Calculate the right padding based on visible buttons
  const calculateButtonWidth = () => {
    let buttonCount = 1 // Always have send button
    if (props.hasMessages && props.clearMessages) buttonCount++ // Delete button
    if (props.mode && props.setMode) buttonCount++ // Settings button
    if (props.allowAttachments) buttonCount++ // Attach button
    if (isSpeechSupported) buttonCount++ // Mic button
    
    // Each button is 32px wide + 8px gap, plus 12px padding from edge
    return (buttonCount * 32) + ((buttonCount - 1) * 8) + 12
  }

  const buttonAreaWidth = calculateButtonWidth()

  const showFileList =
    props.allowAttachments && props.files && props.files.length > 0
  useAutosizeTextArea({
    ref: textAreaRef,
    maxHeight: 200, // Reduced from 240 to provide better UX with smaller max height
    borderWidth: 1,
    dependencies: [props.value, showFileList],
  })
  
  return (
    <div
      className="relative flex w-full"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {enableInterrupt && (
        <InterruptPrompt
          isOpen={showInterruptPrompt}
          close={() => setShowInterruptPrompt(false)}
        />
      )}

      <RecordingPrompt
        isVisible={isRecording}
        onStopRecording={stopRecording}
      />      <div className="relative flex w-full items-center space-x-2">
        
        <div className="relative flex-1">
          <textarea
            aria-label="Write your prompt here"
            placeholder=""
            ref={textAreaRef}
            onPaste={onPaste}
            onKeyDown={onKeyDown}
            onFocus={props.onFocus}
            onBlur={props.onBlur}            className={cn(
              "relative z-10 w-full grow resize-none rounded-xl border-2 border-input bg-background p-3 text-sm ring-offset-background transition-[border,height] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              props.mode === 'agent' 
                ? "focus-visible:border-blue-500" 
                : "focus-visible:border-primary",
              showFileList && "pb-16",
              className
            )}
            style={{
              paddingRight: `${buttonAreaWidth}px`
            }}            {...(props.allowAttachments
              ? omit(props, [
                  "allowAttachments", 
                  "files", 
                  "setFiles", 
                  "mode", 
                  "setMode", 
                  "provider", 
                  "setProvider", 
                  "selectedModel", 
                  "setSelectedModel",
                  "responseStyle",
                  "setResponseStyle",
                  "clearMessages",
                  "hasMessages"
                ])
              : omit(props, [
                  "allowAttachments", 
                  "mode", 
                  "setMode", 
                  "provider", 
                  "setProvider", 
                  "selectedModel", 
                  "setSelectedModel",
                  "responseStyle",
                  "setResponseStyle",
                  "clearMessages",
                  "hasMessages"
                ] as any)) as any}
          />

          {/* Animated placeholder overlay - positioned above textarea */}
          {!props.value && (
            <div className="absolute top-3 left-3 pointer-events-none z-20 text-muted-foreground">
              <AnimatedPlaceholder
                suggestions={promptSuggestions}
                className="text-sm"
                typingSpeed={80}
                deletingSpeed={40}
                pauseDuration={2500}
              />
            </div>
          )}

          {props.allowAttachments && (
            <div className="absolute inset-x-3 bottom-0 z-20 overflow-x-auto py-3">
              <div className="flex space-x-3">
                <AnimatePresence mode="popLayout">
                  {props.files?.map((file) => {
                    return (
                      <FilePreview
                        key={file.name + String(file.lastModified)}
                        file={file}
                        onRemove={() => {
                          props.setFiles((files) => {
                            if (!files) return null

                            const filtered = Array.from(files).filter(
                              (f) => f !== file
                            )
                            if (filtered.length === 0) return null
                            return filtered
                          })
                        }}
                      />
                    )
                  })}                </AnimatePresence>
              </div>
            </div>          )}
        </div>
      </div>      <div className="absolute right-3 top-3 z-20 flex gap-2">
        {/* Delete Conversation Button */}
        <AnimatePresence>
          {props.hasMessages && props.clearMessages && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 10 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                x: 0,
                transition: { 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 25 
                }
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.8, 
                x: 10,
                transition: { 
                  type: "spring", 
                  stiffness: 350, 
                  damping: 30 
                }
              }}
            >              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8 group hover:bg-red-50 hover:border-red-200 hover:text-red-600 border-2"
                aria-label="Delete conversation"
                onClick={() => {
                  if (props.clearMessages) {
                    props.clearMessages()
                  }
                }}
              >
                <Trash2 className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Settings Tooltip / Drawer */}
        {props.mode && props.setMode && (
          isMobile ? (
            <Drawer>              <DrawerTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 group border-2"
                  aria-label="Settings"
                >
                  <Settings className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90 group-hover:scale-110" />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Settings</DrawerTitle>
                </DrawerHeader>
                <div className="p-4 overflow-y-auto">                  <SettingsFormContents
                    mode={props.mode}
                    setMode={props.setMode}
                    provider={props.provider}
                    setProvider={props.setProvider}
                    selectedModel={props.selectedModel}
                    setSelectedModel={props.setSelectedModel}
                    availableModels={availableModels}
                    isLoadingModels={isLoadingModels}
                    modelSearchQuery={modelSearchQuery}
                    setModelSearchQuery={setModelSearchQuery}
                    filteredModels={filteredModels}
                    getCurrentProvider={getCurrentProvider}
                    getCurrentModel={getCurrentModel}
                    selectOpen={drawerSelectOpen}
                    setSelectOpen={setDrawerSelectOpen}
                    searchInputRef={drawerSearchInputRef}
                    messageActionsAlwaysVisible={messageActionsAlwaysVisible}
                    setMessageActionsAlwaysVisible={setMessageActionsAlwaysVisible}
                    // setParentTooltipOpen is not applicable for Drawer
                  />
                </div>                <DrawerFooter className="pt-2">
                  <DrawerClose asChild>
                    <Button variant="outline" className="border-2">Close</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          ) : (            <SettingsTooltip
              mode={props.mode}
              setMode={props.setMode}
              provider={props.provider}
              setProvider={props.setProvider}
              selectedModel={props.selectedModel}
              setSelectedModel={props.setSelectedModel}
              responseStyle={props.responseStyle}
              setResponseStyle={props.setResponseStyle}
              // Pass the model-related props to SettingsTooltip as well
              availableModels={availableModels}
              isLoadingModels={isLoadingModels}
              modelSearchQuery={modelSearchQuery}
              setModelSearchQuery={setModelSearchQuery}
              filteredModels={filteredModels}
              getCurrentProvider={getCurrentProvider}
              getCurrentModel={getCurrentModel}
              messageActionsAlwaysVisible={messageActionsAlwaysVisible}
              setMessageActionsAlwaysVisible={setMessageActionsAlwaysVisible}>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8 group border-2"
                aria-label="Settings"
              >
                <Settings className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90 group-hover:scale-110" />
              </Button>
            </SettingsTooltip>
          )
        )}
          {props.allowAttachments && (
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8 group border-2"
            aria-label="Attach a file"
            onClick={async () => {
              const files = await showFileUploadDialog()
              addFiles(files)
            }}
          >
            <Paperclip className="h-4 w-4 transition-transform duration-200 group-hover:rotate-12 group-hover:scale-110" />
          </Button>
        )}        {isSpeechSupported && (
          <Button
            type="button"
            variant="outline"
            className={cn("h-8 w-8 group border-2", isListening && "text-primary")}
            aria-label="Voice input"
            size="icon"
            onClick={toggleListening}
          >
            <Mic className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
          </Button>
        )}
        {isGenerating && stop ? (
          <Button
            type="button"
            size="icon"
            className={cn(
              "h-8 w-8 group",
              props.mode === 'agent' ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-green-500 hover:bg-green-600 text-white"
            )}
            aria-label="Stop generating"
            onClick={stop}
          >
            <Square className="h-3 w-3 animate-pulse transition-transform duration-200 group-hover:scale-110" fill="currentColor" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            className={cn(
              "h-8 w-8 group transition-all duration-200",
              props.mode === 'agent' ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-green-500 hover:bg-green-600 text-white"
            )}
            aria-label="Send message"
            disabled={props.value === "" || isGenerating}          >            <ArrowUp className="h-5 w-5 transition-transform duration-200 group-hover:scale-110 group-hover:-translate-y-0.5" />
          </Button>
        )}
      </div>

      {props.allowAttachments && <FileUploadOverlay isDragging={isDragging} />}

      <RecordingControls
        isRecording={isRecording}        isTranscribing={isTranscribing}
        audioStream={audioStream}        textAreaHeight={textAreaHeight}
        onStopRecording={stopRecording}
      />
    </div>
  )
}
MessageInput.displayName = "MessageInput"

interface FileUploadOverlayProps {
  isDragging: boolean
}

function FileUploadOverlay({ isDragging }: FileUploadOverlayProps) {
  return (
    <AnimatePresence>
      {isDragging && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center space-x-2 rounded-xl border border-dashed border-border bg-background text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          aria-hidden
        >
          <Paperclip className="h-4 w-4" />
          <span>Drop your files here to attach them.</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function showFileUploadDialog() {
  const input = document.createElement("input")

  input.type = "file"
  input.multiple = true
  input.accept = "*/*"
  input.click()

  return new Promise<File[] | null>((resolve) => {
    input.onchange = (e) => {
      const files = (e.currentTarget as HTMLInputElement).files

      if (files) {
        resolve(Array.from(files))
        return
      }

      resolve(null)
    }
  })
}

function TranscribingOverlay() {
  return (
    <motion.div
      className="flex h-full w-full flex-col items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <motion.div
          className="absolute inset-0 h-8 w-8 animate-pulse rounded-full bg-primary/20"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 1 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground">
        Transcribing audio...
      </p>
    </motion.div>
  )
}

interface RecordingPromptProps {
  isVisible: boolean
  onStopRecording: () => void
}

function RecordingPrompt({ isVisible, onStopRecording }: RecordingPromptProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ top: 0, filter: "blur(5px)" }}
          animate={{
            top: -40,
            filter: "blur(0px)",
            transition: {
              type: "spring",
              filter: { type: "tween" },
            },
          }}
          exit={{ top: 0, filter: "blur(5px)" }}
          className="absolute left-1/2 flex -translate-x-1/2 cursor-pointer overflow-hidden whitespace-nowrap rounded-full border bg-background py-1 text-center text-sm text-muted-foreground"
          onClick={onStopRecording}
        >
          <span className="mx-2.5 flex items-center">
            <Info className="mr-2 h-3 w-3" />
            Click to finish recording
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface RecordingControlsProps {
  isRecording: boolean
  isTranscribing: boolean
  audioStream: MediaStream | null
  textAreaHeight: number
  onStopRecording: () => void
}

function RecordingControls({
  isRecording,
  isTranscribing,
  audioStream,
  textAreaHeight,
  onStopRecording,
}: RecordingControlsProps) {
  if (isRecording) {
    return (
      <div
        className="absolute inset-[1px] z-50 overflow-hidden rounded-xl"
        style={{ height: textAreaHeight - 2 }}
      >
        <AudioVisualizer
          stream={audioStream}
          isRecording={isRecording}
          onClick={onStopRecording}
        />
      </div>
    )
  }

  if (isTranscribing) {
    return (
      <div
        className="absolute inset-[1px] z-50 overflow-hidden rounded-xl"
        style={{ height: textAreaHeight - 2 }}
      >
        <TranscribingOverlay />
      </div>
    )
  }

  return null
}
