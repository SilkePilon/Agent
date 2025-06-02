"use client"

import * as React from "react" // Added Info and DollarSign icons
import { Bot, MessageCircle, Settings, ChevronDown, DollarSign, Info, Search, Loader2, Brain } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Gemini, OpenRouter, OpenAI, Anthropic, Mistral, Meta, Cohere, Gemma, Perplexity, Qwen, Grok } from '@lobehub/icons'
import { cn } from "@/lib/utils"
import { getAllModels, type ModelOption } from "@/lib/models"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { ModelSelector } from "@/components/ui/model-selector"


interface ScrollingTextProps {
    text: string
    className?: string
    maxWidth?: number   
    isParentHovered?: boolean
}

function ScrollingText({ text, className, maxWidth = 200, isParentHovered }: ScrollingTextProps) {
    const [internalHovered, setInternalHovered] = React.useState(false)
    const textRef = React.useRef<HTMLDivElement>(null)
    const [shouldScroll, setShouldScroll] = React.useState(false)

    const isHovered = isParentHovered !== undefined ? isParentHovered : internalHovered
    React.useEffect(() => {
        if (textRef.current) {
            const textWidth = textRef.current.scrollWidth
            // Lower threshold to trigger scrolling more often for model names
            setShouldScroll(textWidth > maxWidth - 10)
        }
    }, [text, maxWidth])

    return (
        <div
            className={cn("relative overflow-hidden", className)}
            style={{ maxWidth }} onMouseEnter={() => setInternalHovered(true)}
            onMouseLeave={() => setInternalHovered(false)}
        >
            <motion.div
                ref={textRef}
                className="whitespace-nowrap"
                animate={
                    shouldScroll && isHovered
                        ? {
                            x: [0, -(textRef.current?.scrollWidth || 0) + maxWidth - 20, 0],
                        }
                        : { x: 0 }
                } transition={
                    shouldScroll && isHovered
                        ? {
                            duration: Math.max(2.5, (textRef.current?.scrollWidth || 0) / 60),
                            repeat: Infinity,
                            ease: "linear",
                            repeatDelay: 1.5,
                            times: [0, 0.4, 0.8, 1], // Pause at the end before returning
                        }
                        : { duration: 0.3 }
                }
            >
                {text}
            </motion.div>
        </div>
    )
}

interface SettingsTooltipProps {
    mode?: 'agent' | 'chat'
    setMode?: (mode: 'agent' | 'chat') => void
    provider?: 'openrouter' | 'google'
    setProvider?: (provider: 'openrouter' | 'google') => void
    selectedModel?: string
    setSelectedModel?: (model: string) => void
    children: React.ReactNode
    messageActionsAlwaysVisible?: boolean
    setMessageActionsAlwaysVisible?: (value: boolean) => void
    getCurrentProvider?: () => string
    getCurrentModel?: () => string
    availableModels?: any[]
    isLoadingModels?: boolean
    modelSearchQuery?: string
    setModelSearchQuery?: (query: string) => void
    filteredModels?: any[]
}

interface SettingsFormContentsProps {
    mode?: 'agent' | 'chat'
    setMode?: (mode: 'agent' | 'chat') => void
    provider?: 'openrouter' | 'google'
    setProvider?: (provider: 'openrouter' | 'google') => void
    selectedModel?: string
    setSelectedModel?: (model: string) => void
    messageActionsAlwaysVisible?: boolean
    setMessageActionsAlwaysVisible?: (value: boolean) => void
    getCurrentProvider: () => string
    getCurrentModel: () => string
    setParentTooltipOpen?: (open: boolean) => void 
    onModelSelectorOpenChange?: (open: boolean) => void
    availableModels?: any[]
    isLoadingModels?: boolean
    modelSearchQuery?: string
    setModelSearchQuery?: (query: string) => void
    filteredModels?: any[]
    selectOpen?: boolean
    setSelectOpen?: (open: boolean) => void
    searchInputRef?: React.RefObject<HTMLInputElement | null>
}

export function SettingsFormContents({
    mode,
    setMode,
    provider,
    setProvider,
    selectedModel,    setSelectedModel,
    messageActionsAlwaysVisible = false,
    setMessageActionsAlwaysVisible,
    getCurrentProvider,
    getCurrentModel,
    setParentTooltipOpen, // Optional: only used when in a Tooltip
    onModelSelectorOpenChange, // Callback for model selector state
}: SettingsFormContentsProps) {
    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Settings className="h-4 w-4" />
                Settings
            </div>

            {/* Mode Switch */}
            {mode && setMode && (
                <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Mode</div>
                    <div className="flex gap-1">                        <Button
                            variant={mode === 'agent' ? 'default' : 'outline'}
                            size="sm"
                            className={cn(
                                "flex-1 h-8 text-xs transition-all duration-200",
                                mode === 'agent'
                                    ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                                    : "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-foreground border-2"
                            )}
                            onClick={() => setMode('agent')}
                        >
                            <Bot className="h-3 w-3 mr-1" />
                            Agent
                        </Button>                        <Button
                            variant={mode === 'chat' ? 'default' : 'outline'}
                            size="sm"
                            className={cn(
                                "flex-1 h-8 text-xs transition-all duration-200",
                                mode === 'chat'
                                    ? "bg-green-500 hover:bg-green-600 text-white shadow-sm"
                                    : "hover:bg-green-50 hover:text-green-600 hover:border-green-200 text-foreground border-2"
                            )}
                            onClick={() => setMode('chat')}
                        >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Chat
                        </Button>
                    </div>
                </div>
            )}

            {/* Provider Selection */}
            {provider && setProvider && (
                <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Provider</div>
                    <div className="flex gap-1">                <Button
                        variant={provider === 'google' ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                            "flex-1 h-8 text-xs transition-all duration-200",
                            provider === 'google'
                                ? "bg-purple-600 hover:bg-purple-700 text-white" // Active state
                                : "hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 text-foreground border-2" // Inactive state
                        )}
                        onClick={() => setProvider?.('google')}
                    >
                        <Gemini className={cn(
                            "h-3.5 w-3.5 mr-1",
                            provider !== 'google' && "text-purple-600" // Icon color for inactive state
                        )} />
                        Gemini
                    </Button>                <Button
                        variant={provider === 'openrouter' ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                            "flex-1 h-8 text-xs transition-all duration-200 group", // Added group for icon hover
                            provider === 'openrouter'
                                ? "bg-[#6467f2] hover:bg-[#5254d4] text-white" // Active state
                                : "hover:bg-[#f0f0ff] hover:text-[#6467f2] hover:border-[#d0d1fa] text-foreground border-2" // Inactive state
                        )}
                        onClick={() => setProvider?.('openrouter')}                >                  <OpenRouter className={cn(
                            "h-3.5 w-3.5 mr-1",
                            provider !== 'openrouter' && "text-[#6467f2] group-hover:text-[#5254d4]" // Icon color for inactive and hover states
                        )} />
                            OpenRouter
                        </Button></div>
                </div>
            )}            {/* Model Selection for OpenRouter */}
            {provider === 'openrouter' && setSelectedModel && (
                <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Model</div>                    <ModelSelector
                        selectedModel={selectedModel}
                        onModelSelect={setSelectedModel}
                        provider={provider}
                        onOpenChange={onModelSelectorOpenChange}
                    />
                </div>
            )}

            {/* Message Actions Visibility Setting */}
            {setMessageActionsAlwaysVisible && (
                <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Message Actions</div>
                    <div className="flex gap-1">                        <Button
                            variant={messageActionsAlwaysVisible ? 'default' : 'outline'}
                            size="sm"
                            className={cn(
                                "flex-1 h-8 text-xs transition-all duration-200",
                                messageActionsAlwaysVisible
                                    ? "bg-green-500 hover:bg-green-600 text-white shadow-sm"
                                    : "hover:bg-green-50 hover:text-green-600 hover:border-green-200 text-foreground border-2"
                            )}
                            onClick={() => setMessageActionsAlwaysVisible(true)}
                        >
                            Always Visible
                        </Button>                        <Button
                            variant={!messageActionsAlwaysVisible ? 'default' : 'outline'}
                            size="sm"
                            className={cn(
                                "flex-1 h-8 text-xs transition-all duration-200",
                                !messageActionsAlwaysVisible
                                    ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                                    : "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-foreground border-2"
                            )}
                            onClick={() => setMessageActionsAlwaysVisible(false)}
                        >
                            On Hover
                        </Button>
                    </div>
                </div>
            )}

            {/* Current Configuration */}
            <div className="space-y-2 pt-2 border-t border-border">
                <div className="text-xs font-medium text-muted-foreground">Current Setup</div>
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-foreground">Provider:</span>
                        <Badge variant="secondary" className="text-xs">
                            {getCurrentProvider()}
                        </Badge>
                    </div>              <div className="flex items-center justify-between">
                        <span className="text-xs text-foreground">Model:</span>
                        <Badge variant="outline" className="text-xs max-w-32 px-2 py-1">
                            <ScrollingText
                                text={getCurrentModel()}
                                className="text-xs"
                                maxWidth={112}
                            />
                        </Badge>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function SettingsTooltip({
    mode,
    setMode,
    provider,
    setProvider,
    selectedModel,
    setSelectedModel,
    children,
    messageActionsAlwaysVisible = false,
    setMessageActionsAlwaysVisible,
}: SettingsTooltipProps) {    const [isOpen, setIsOpen] = React.useState(false)
    const [isModelSelectorOpen, setIsModelSelectorOpen] = React.useState(false)
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)

    // Handle tooltip open/close with model selector consideration
    const handleTooltipOpenChange = (open: boolean) => {
        // Clear any pending timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
        
        // Don't close tooltip if model selector is open
        if (!open && isModelSelectorOpen) {
            return
        }
        setIsOpen(open)
    }

    // Handle model selector open state change
    const handleModelSelectorOpenChange = (open: boolean) => {
        setIsModelSelectorOpen(open)
        // If model selector is opening, ensure tooltip stays open
        if (open) {
            setIsOpen(true)
        }
    }    // Cleanup timeout on unmount
    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    const getCurrentProvider = () => {
        if (provider === 'google') return 'Google Gemini'
        return 'OpenRouter'
    }

    const getCurrentModel = () => {
        if (provider === 'google') return 'Gemini Pro 1.5' // Assuming a default or latest Google model
        if (provider === 'openrouter' && selectedModel) {
            // Since we're using the new ModelSelector, we don't need to search availableModels here
            return selectedModel.split('/').pop()?.split(':')[0] || 'Default'
        } 
        return 'Default'
    }
      return (
        <TooltipProvider>
            <Tooltip open={isOpen} onOpenChange={handleTooltipOpenChange} delayDuration={0}>
                <TooltipTrigger asChild onClick={() => setIsOpen(!isOpen)}>
                    {children}
            </TooltipTrigger>
            <TooltipContent
                side="top"
                className="w-72 p-0 bg-background border border-border shadow-md rounded-lg overflow-hidden"
                sideOffset={8}
                onPointerEnter={() => setIsOpen(true)}                onPointerLeave={(e) => {
                    // Don't close if model selector is open or if we're moving to the model selector
                    if (!isModelSelectorOpen) {
                        // Add a small delay to prevent premature closing
                        timeoutRef.current = setTimeout(() => {
                            if (!isModelSelectorOpen) {
                                setIsOpen(false)
                            }
                        }, 100)
                    }
                }}
            ><SettingsFormContents
                    mode={mode}
                    setMode={setMode}
                    provider={provider}
                    setProvider={setProvider}
                    selectedModel={selectedModel}
                    setSelectedModel={setSelectedModel}
                    messageActionsAlwaysVisible={messageActionsAlwaysVisible}
                    setMessageActionsAlwaysVisible={setMessageActionsAlwaysVisible}
                    getCurrentProvider={getCurrentProvider}
                    getCurrentModel={getCurrentModel}
                    setParentTooltipOpen={setIsOpen} // Pass setIsOpen to allow child to control parent                    onModelSelectorOpenChange={handleModelSelectorOpenChange} // Pass model selector state callback
                />
            </TooltipContent>
        </Tooltip>
        </TooltipProvider>
    )
}
