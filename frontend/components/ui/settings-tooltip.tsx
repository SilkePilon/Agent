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

// Helper function to format price per 1 million tokens
const formatPricePerMillionTokens = (price?: number | string): string => {
    if (price === "Free" || typeof price === 'undefined' || price === null) {
        return "Free";
    }

    // Assuming 'price' is per token.
    const rawNumericPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.-]+/g,"")) : price;

    if (isNaN(rawNumericPrice) || rawNumericPrice === 0) {
        return "Free";
    }

    // If the displayed price (e.g., $150.00 / 1M) is 100x larger than expected (e.g., $1.50 / 1M),
    // it implies the rawNumericPrice (per token) is effectively 100x too large
    // when directly converted to dollars. This adjusts for that by treating rawNumericPrice
    // as if it's in units that are 1/100th of a dollar (e.g. cents per token).
    const priceInAdjustedUnitsPerToken = rawNumericPrice / 100;

    const pricePerMillion = priceInAdjustedUnitsPerToken * 1_000_000;

    // Using toLocaleString for better currency formatting, assuming USD
    // and ensuring two decimal places.
    return `${pricePerMillion.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })} / 1M`;
};

// Helper function to get model icon
const getModelIcon = (model: ModelOption): React.ReactNode => {
    const modelIdLower = model.id.toLowerCase();
    const modelNameLower = model.name.toLowerCase();

    if (modelIdLower.includes('openai') || modelNameLower.includes('openai')) {
        return <OpenAI className="h-3.5 w-3.5 text-green-500" />;
    }
    if (modelIdLower.includes('claude') || modelNameLower.includes('claude')) {
        return <Anthropic className="h-3.5 w-3.5 text-orange-500" />;
    }
    if (modelIdLower.includes('gemini') || modelNameLower.includes('gemini')) {
        return <Gemini className="h-3.5 w-3.5 text-purple-600" />;
    }
    if (modelIdLower.includes('mistral') || modelIdLower.includes('mixtral') || modelNameLower.includes('mistral') || modelNameLower.includes('mixtral')) {
        return <Mistral className="h-3.5 w-3.5 text-yellow-500" />;
    }
    if (modelIdLower.includes('llama') || modelNameLower.includes('llama')) {
        return <Meta className="h-3.5 w-3.5 text-blue-500" />;
    }
    if (modelIdLower.includes('cohere') || modelNameLower.includes('cohere')) {
        return <Cohere className="h-3.5 w-3.5 text-red-500" />;
    }
    if (modelIdLower.includes('gemma') || modelNameLower.includes('gemma')) {
        return <Gemma.Simple className="h-3.5 w-3.5 text-red-500" />;
    }
    if (modelIdLower.includes('perplexity') || modelNameLower.includes('perplexity')) {
        return <Perplexity.Color className="h-3.5 w-3.5" />;
    }
    if (modelIdLower.includes('qwen') || modelNameLower.includes('qwen')) {
        return <Qwen className="h-3.5 w-3.5" />;
    }
    if (modelIdLower.includes('xai') || modelNameLower.includes('xai')) {
        return <Grok className="h-3.5 w-3.5" />;
    }
    return <Brain className="h-3.5 w-3.5 text-muted-foreground" />; // Default icon
};

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
                    <div className="flex items-center gap-2 w-full text-left">
                        <div className="flex-shrink-0">{getModelIcon(model)}</div>
                        <div className="flex-grow min-w-0"> {/* Ensure this div can shrink and grow */}
                            <ScrollingText
                                text={model.name}
                                className="font-medium text-foreground text-left"
                                maxWidth={190} // Adjusted maxWidth to account for icon
                                isParentHovered={isHovered}
                            />
                        </div>
                    </div>
                </div>
            </TooltipTrigger>      
            <TooltipContent
                side="right"
                align="start"
                sideOffset={10}
                className="max-w-xs p-0 bg-background border border-border shadow-md rounded-lg overflow-hidden z-[9999]"
            >
                <div className="p-3 space-y-1.5"> {/* Adjusted padding to inner div and space-y */}
                    <div className="flex items-center gap-2 font-medium text-foreground">
                        {getModelIcon(model)}
                        {model.name}
                    </div>                    {model.description && (
                        <div className="text-xs text-muted-foreground whitespace-normal leading-relaxed prose prose-xs max-w-none prose-p:my-1 prose-code:text-xs prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-strong:font-semibold prose-em:italic">
                            <MarkdownRenderer>{model.description}</MarkdownRenderer>
                        </div>
                    )}
                    <div className="flex items-center text-xs text-muted-foreground">
                        <Info className="h-3 w-3 mr-1.5 text-muted-foreground/80" />
                        <span className="font-semibold mr-1">ID:</span> {model.id.split('/').pop() || model.id}
                    </div>
                    {/* Pricing display with slightly improved formatting */}
                    {(model.pricing?.prompt || model.pricing?.completion) ? (
                        <div className="text-xs text-muted-foreground pt-1 space-y-0.5">
                            <div className="font-semibold">Pricing:</div>
                            <div className="space-y-0.5"> {/* Removed pl, icons will provide alignment */}
                                <div className="flex items-center">
                                    <DollarSign className="h-3 w-3 mr-1.5 text-muted-foreground/80 flex-shrink-0" />
                                    Input: <span className="ml-1 font-mono opacity-90">{formatPricePerMillionTokens(model.pricing.prompt)}</span>
                                </div>
                                <div className="flex items-center">
                                    <DollarSign className="h-3 w-3 mr-1.5 text-muted-foreground/80 flex-shrink-0" />
                                    Output: <span className="ml-1 font-mono opacity-90">{formatPricePerMillionTokens(model.pricing.completion)}</span>
                                </div>
                            </div>
                        </div>
                    ) : model.pricing !== undefined ? ( // Catches cases where pricing object exists but values might be empty/zero, explicitly "Free"
                         <div className="flex items-center text-xs text-muted-foreground pt-1"><DollarSign className="h-3 w-3 mr-1.5 text-muted-foreground/80" /><span className="font-semibold">Pricing:</span> Free</div>
                    ) : null /* No pricing information available */}
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
    // Props for SettingsFormContents that might be managed by SettingsTooltip
    availableModels?: ModelOption[]
    isLoadingModels?: boolean
    modelSearchQuery?: string
    setModelSearchQuery?: (query: string) => void
    filteredModels?: ModelOption[]
    getCurrentProvider?: () => string
    getCurrentModel?: () => string
    // For select dropdown state, if needed to be controlled from outside or passed to SettingsFormContents
    selectOpen?: boolean
    setSelectOpen?: (open: boolean) => void
    searchInputRef?: React.RefObject<HTMLInputElement>
}

interface SettingsFormContentsProps {
    mode?: 'agent' | 'chat'
    setMode?: (mode: 'agent' | 'chat') => void
    provider?: 'openrouter' | 'google'
    setProvider?: (provider: 'openrouter' | 'google') => void
    selectedModel?: string
    setSelectedModel?: (model: string) => void
    availableModels: ModelOption[]
    isLoadingModels: boolean
    modelSearchQuery: string
    setModelSearchQuery: (query: string) => void
    filteredModels: ModelOption[]
    getCurrentProvider: () => string
    getCurrentModel: () => string
    // For select dropdown state, to be used internally by the form
    selectOpen: boolean
    setSelectOpen: (open: boolean) => void
    searchInputRef: React.RefObject<HTMLInputElement | null>
    // To control main tooltip visibility from select, if SettingsFormContents is used in Tooltip
    setParentTooltipOpen?: (open: boolean) => void 
}

export function SettingsFormContents({
    mode,
    setMode,
    provider,
    setProvider,
    selectedModel,
    setSelectedModel,
    availableModels,
    isLoadingModels,
    modelSearchQuery,
    setModelSearchQuery,
    filteredModels,
    getCurrentProvider,
    getCurrentModel,
    selectOpen, // internal state for the select dropdown
    setSelectOpen, // function to update this internal state
    searchInputRef, // ref for the search input
    setParentTooltipOpen, // Optional: only used when in a Tooltip
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
                                ? "bg-purple-600 hover:bg-purple-700 text-white" // Active state
                                : "hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 text-foreground" // Inactive state
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
                                : "hover:bg-[#f0f0ff] hover:text-[#6467f2] hover:border-[#d0d1fa] text-foreground" // Inactive state
                        )}
                        onClick={() => setProvider?.('openrouter')}                >                  <OpenRouter className={cn(
                            "h-3.5 w-3.5 mr-1",
                            provider !== 'openrouter' && "text-[#6467f2] group-hover:text-[#5254d4]" // Icon color for inactive and hover states
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
                            if (open) {
                                setSelectOpen(true);
                                if (setParentTooltipOpen) setParentTooltipOpen(true); // Ensure main tooltip stays open if applicable
                                setTimeout(() => searchInputRef.current?.focus(), 0);
                            } else {
                                setSelectOpen(false);
                                if (document.activeElement === searchInputRef.current || searchInputRef.current?.value) {
                                    setTimeout(() => searchInputRef.current?.focus(), 0);
                                }
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
                            onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                            <div
                                className="p-2 bg-popover -mx-1 -mt-1 mb-1 border-b"
                            >
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        ref={searchInputRef}
                                        type="search"
                                        placeholder="Search models..."
                                        value={modelSearchQuery}
                                        onChange={(e) => setModelSearchQuery(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        onFocus={(e) => e.stopPropagation()}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape') {
                                                e.stopPropagation();
                                                if (modelSearchQuery) {
                                                    setModelSearchQuery('');
                                                    e.preventDefault();
                                                }
                                                return;
                                            }
                                            if (['ArrowUp', 'ArrowDown', 'Enter', 'Home', 'End', 'PageUp', 'PageDown', 'Tab'].includes(e.key)) {
                                                e.stopPropagation();
                                            }
                                            e.stopPropagation();
                                        }}
                                        className="h-8 text-xs w-full pl-8"
                                    />
                                </div>
                            </div>
                            {isLoadingModels ? (
                                <div className="flex items-center justify-center p-4 text-xs text-muted-foreground">
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Loading models...
                                </div>
                            ) : filteredModels.length > 0 ? (
                                filteredModels.map((model) => (
                                    <SelectItem
                                        key={model.id}
                                        value={model.id}
                                        className="text-xs text-left relative"
                                    >
                                        <ModelItemContent model={model} />
                                    </SelectItem>
                                ))
                            ) : (
                                <div className="p-2 text-center text-xs text-muted-foreground">
                                    No models found.
                                </div>
                            )}
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
}: SettingsTooltipProps) {
    const [availableModels, setAvailableModels] = React.useState<ModelOption[]>([])
    const [isLoadingModels, setIsLoadingModels] = React.useState(false);
    const [isOpen, setIsOpen] = React.useState(false)
    const [selectOpen, setSelectOpen] = React.useState(false) // State for select dropdown
    const [modelSearchQuery, setModelSearchQuery] = React.useState("");
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (provider === 'openrouter' && isOpen) { // Fetch models only if provider is OpenRouter and tooltip is open
            setIsLoadingModels(true);
            getAllModels()
                .then(setAvailableModels)
                .catch(error => {
                    console.error("Failed to load models:", error)
                })
                .finally(() => setIsLoadingModels(false));
        } else if (provider !== 'openrouter') {
            setAvailableModels([]); // Clear models if provider is not OpenRouter
        }
    }, [provider, isOpen])

    const filteredModels = React.useMemo(() => {
        if (provider !== 'openrouter' || !availableModels.length) {
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
    }, [availableModels, modelSearchQuery, provider]);

    const handleOpenChange = React.useCallback((newOpen: boolean) => {
        if (!newOpen) {
            if (selectOpen) return; // Don't close if select is open
            if (document.activeElement === searchInputRef.current && modelSearchQuery) return; // Don't close if search input is active with content
            setModelSearchQuery(""); 
        }
        setIsOpen(newOpen);
    }, [selectOpen, searchInputRef, modelSearchQuery]);

    const getCurrentProvider = () => {
        if (provider === 'google') return 'Google Gemini'
        return 'OpenRouter'
    }

    const getCurrentModel = () => {
        if (provider === 'google') return 'Gemini Pro 1.5' // Assuming a default or latest Google model
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
                <SettingsFormContents
                    mode={mode}
                    setMode={setMode}
                    provider={provider}
                    setProvider={setProvider}
                    selectedModel={selectedModel}
                    setSelectedModel={setSelectedModel}
                    availableModels={availableModels}
                    isLoadingModels={isLoadingModels}
                    modelSearchQuery={modelSearchQuery}
                    setModelSearchQuery={setModelSearchQuery}
                    filteredModels={filteredModels}
                    getCurrentProvider={getCurrentProvider}
                    getCurrentModel={getCurrentModel}
                    selectOpen={selectOpen}
                    setSelectOpen={setSelectOpen}
                    searchInputRef={searchInputRef}
                    setParentTooltipOpen={setIsOpen} // Pass setIsOpen to allow child to control parent
                />
            </TooltipContent>
        </Tooltip>
    )
}
