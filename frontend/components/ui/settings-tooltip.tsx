"use client"

import * as React from "react"
import { Bot, MessageCircle, Settings, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Gemini, OpenRouter } from '@lobehub/icons'

import { cn } from "@/lib/utils"
import { getAllModels, type ModelOption } from "@/lib/models"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

// Scrolling text component for long model names
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

// Component for model item content with shared hover state
interface ModelItemContentProps {
    model: ModelOption
}

function ModelItemContent({ model }: ModelItemContentProps) {
    const [isHovered, setIsHovered] = React.useState(false)
    const [openTooltip, setOpenTooltip] = React.useState(false)
    const tooltipDelay = React.useRef<NodeJS.Timeout | null>(null)

    const handleMouseEnter = () => {
        setIsHovered(true)
        // Delay tooltip appearance to prevent flickering
        tooltipDelay.current = setTimeout(() => {
            setOpenTooltip(true)
        }, 300)
    }

    const handleMouseLeave = () => {
        setIsHovered(false)
        if (tooltipDelay.current) {
            clearTimeout(tooltipDelay.current)
        }
        setOpenTooltip(false)
    }

    return (
        <Tooltip open={openTooltip && !!model.description}>
            <TooltipTrigger asChild>
                <div
                    className="flex flex-col items-start justify-start w-full text-left"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <div className="w-full text-left">
                        <ScrollingText
                            text={model.name}
                            className="font-medium text-foreground text-left"
                            maxWidth={224}
                            isParentHovered={isHovered}
                        />
                    </div>
                    {model.description && (
                        <div className="w-full overflow-hidden text-left">
                            <span className="text-muted-foreground text-xs truncate block max-w-[224px] text-left">
                                {model.description}
                            </span>
                        </div>
                    )}
                </div>
            </TooltipTrigger>      <TooltipContent
                side="right"
                align="start"
                sideOffset={10}
                className="max-w-xs p-3 text-sm bg-popover border shadow-md z-[9999]"
            >
                <div className="space-y-2">
                    <div className="font-medium text-foreground">{model.name}</div>
                    <div className="text-xs text-muted-foreground whitespace-normal leading-relaxed">
                        {model.description}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {model.id.split('/').join(' / ')}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {model.pricing?.completion || "Free"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {model.pricing?.prompt || "Free"}
                    </div>
                </div>
            </TooltipContent>
        </Tooltip>
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
}

export function SettingsTooltip({
    mode,
    setMode,
    provider,
    setProvider,
    selectedModel,
    setSelectedModel,
    children,
}: SettingsTooltipProps) {
    // Wrap everything in a TooltipProvider with a shorter delay for model tooltips
    const [availableModels, setAvailableModels] = React.useState<ModelOption[]>([])
    const [isOpen, setIsOpen] = React.useState(false)
    const [selectOpen, setSelectOpen] = React.useState(false)

    React.useEffect(() => {
        if (provider === 'openrouter') {
            getAllModels().then(setAvailableModels)
        }
    }, [provider])

    // Custom close handler that considers select state
    const handleOpenChange = React.useCallback((newOpen: boolean) => {
        // Don't close if select is open
        if (!newOpen && selectOpen) {
            return
        }
        setIsOpen(newOpen)
    }, [selectOpen])

    const getCurrentProvider = () => {
        if (provider === 'google') return 'Google Gemini'
        return 'OpenRouter'
    }

    const getCurrentModel = () => {
        if (provider === 'google') return 'Gemini 2.5 Flash'
        if (provider === 'openrouter' && selectedModel) {
            const model = availableModels.find(m => m.id === selectedModel)
            return model?.name || selectedModel.split('/').pop()?.split(':')[0] || 'Default'
        } return 'Default'
    }
    return (
        <Tooltip open={isOpen} onOpenChange={handleOpenChange}>
            <TooltipTrigger asChild onClick={() => setIsOpen(!isOpen)}>
                {children}
            </TooltipTrigger>
            <TooltipContent
                side="top"
                className="w-72 p-0 bg-background border border-border shadow-md rounded-lg overflow-hidden"
                sideOffset={8}
            >
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
                            <div className="flex gap-1">
                                <Button
                                    variant={mode === 'agent' ? 'default' : 'outline'}
                                    size="sm"
                                    className={cn(
                                        "flex-1 h-8 text-xs transition-all duration-200",
                                        mode === 'agent'
                                            ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                                            : "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-foreground"
                                    )}
                                    onClick={() => setMode('agent')}
                                >
                                    <Bot className="h-3 w-3 mr-1" />
                                    Agent
                                </Button>
                                <Button
                                    variant={mode === 'chat' ? 'default' : 'outline'}
                                    size="sm"
                                    className={cn(
                                        "flex-1 h-8 text-xs transition-all duration-200",
                                        mode === 'chat'
                                            ? "bg-green-500 hover:bg-green-600 text-white shadow-sm"
                                            : "hover:bg-green-50 hover:text-green-600 hover:border-green-200 text-foreground"
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
                                        ? "bg-purple-600 hover:bg-purple-700 text-white"
                                        : "hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 text-foreground"
                                )}
                                onClick={() => setProvider?.('google')}
                            >
                                <Gemini className={cn(
                                    "h-3.5 w-3.5 mr-1",
                                    provider !== 'google' && "text-purple-600"
                                )} />
                                Gemini
                            </Button>                <Button
                                variant={provider === 'openrouter' ? 'default' : 'outline'}
                                size="sm"
                                className={cn(
                                    "flex-1 h-8 text-xs transition-all duration-200",
                                    provider === 'openrouter'
                                        ? "bg-[#6467f2] hover:bg-[#5254d4] text-white"
                                        : "hover:bg-[#f0f0ff] hover:text-[#6467f2] hover:border-[#d0d1fa] text-foreground"
                                )}
                                onClick={() => setProvider?.('openrouter')}                >                  <OpenRouter className={cn(
                                    "h-3.5 w-3.5 mr-1",
                                    provider !== 'openrouter' && "text-[#6467f2]"
                                )} />
                                    OpenRouter
                                </Button></div>
                        </div>
                    )}

                    {/* Model Selection for OpenRouter */}
                    {provider === 'openrouter' && setSelectedModel && (
                        <div className="space-y-2">
                            <div className="text-xs font-medium text-muted-foreground">Model</div>              <Select
                                value={selectedModel}
                                onValueChange={setSelectedModel}
                                onOpenChange={(open) => {
                                    setSelectOpen(open)
                                    // Keep tooltip open when select opens
                                    if (open) {
                                        setIsOpen(true)
                                    }
                                }}
                            >
                                <SelectTrigger className="h-8 text-xs w-full">
                                    <SelectValue placeholder="Select a model" />
                                </SelectTrigger>
                                <SelectContent
                                    className="max-h-64"
                                    side="bottom"
                                    align="start"
                                    style={{ width: 'var(--radix-select-trigger-width)' }}
                                >
                                    {availableModels.map((model) => {
                                        return (<SelectItem
                                            key={model.id}
                                            value={model.id}
                                            className="text-xs text-left relative"
                                        >
                                            <ModelItemContent model={model} />
                                        </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
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
            </TooltipContent>
        </Tooltip>
    )
}
