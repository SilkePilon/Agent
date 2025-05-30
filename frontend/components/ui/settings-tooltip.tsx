"use client"

import * as React from "react" // Added Info and DollarSign icons
import { Bot, MessageCircle, Settings, ChevronDown, DollarSign, Info, Search, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { Gemini, OpenRouter } from '@lobehub/icons'

import { cn } from "@/lib/utils"
import { getAllModels, type ModelOption } from "@/lib/models"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
            </TooltipTrigger>      
            <TooltipContent
                side="right"
                align="start"
                sideOffset={10}
                className="max-w-xs p-0 bg-background border border-border shadow-md rounded-lg overflow-hidden z-[9999]"
            >
                <div className="p-3 space-y-1.5"> {/* Adjusted padding to inner div and space-y */}
                    <div className="font-medium text-foreground">{model.name}</div>
                    {model.description && (
                        <div className="text-xs text-muted-foreground whitespace-normal leading-relaxed">
                            {model.description}
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
    const [isLoadingModels, setIsLoadingModels] = React.useState(false);
    const [isOpen, setIsOpen] = React.useState(false)
    const [selectOpen, setSelectOpen] = React.useState(false)
    const [modelSearchQuery, setModelSearchQuery] = React.useState("");
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (provider === 'openrouter') {
            setIsLoadingModels(true);
            getAllModels()
                .then(setAvailableModels)
                .catch(error => {
                    console.error("Failed to load models:", error)
                    // Optionally, set an error state here to display to the user
                })
                .finally(() => setIsLoadingModels(false));
        }
    }, [provider])

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

    // Custom close handler that considers select state
    const handleOpenChange = React.useCallback((newOpen: boolean) => {
        if (!newOpen) { // If trying to close the main tooltip
            if (selectOpen) { // If select dropdown is still open, don't close main tooltip
                return;
            }
            // If the search input is focused, don't close the main tooltip yet.
            // This can happen if the Select closes itself but focus remains (or is restored to) the input.
            if (document.activeElement === searchInputRef.current) {
                return;
            }
            setModelSearchQuery(""); // Clear search when main tooltip actually closes
        }
        setIsOpen(newOpen);
    }, [selectOpen, searchInputRef]);


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
                                        setIsOpen(true); // Ensure main tooltip stays open
                                        // Focus the search input when the select opens
                                        setTimeout(() => searchInputRef.current?.focus(), 0);
                                    } else {
                                        setSelectOpen(false);
                                        // If select closes and search input was focused, try to keep focus on it.
                                        // This helps prevent the main tooltip from closing immediately if the
                                        // select closed due to filtering (e.g., no results).
                                        if (document.activeElement === searchInputRef.current || searchInputRef.current?.value) {
                                            setTimeout(() => searchInputRef.current?.focus(), 0);
                                        }
                                    }
                                }}
                            >
                                <SelectTrigger className="h-8 text-xs w-full">
                                    <SelectValue placeholder="Select a model" />
                                </SelectTrigger>
                                <SelectContent // The Viewport inside SelectContent has p-1 by default.
                                    className="max-h-64"
                                    side="bottom"
                                    align="start"
                                    style={{ width: 'var(--radix-select-trigger-width)' }}
                                    // Prevent main tooltip from closing when select content is interacted with or select closes
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
                                                onClick={(e) => e.stopPropagation()} // Prevent select from closing
                                                onFocus={(e) => e.stopPropagation()}  // Prevent select from closing
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Escape') {
                                                        e.stopPropagation(); // Stop propagation to Select/Tooltip
                                                        if (modelSearchQuery) {
                                                            setModelSearchQuery('');
                                                            e.preventDefault(); // Prevent default if we cleared search
                                                        }
                                                        // If query was empty, Escape might be intended for the Select itself (to close)
                                                        // The stopPropagation above prevents it from closing the main tooltip.
                                                        return;
                                                    }
                                                    // Stop propagation for navigation keys to prevent Select component from acting on them
                                                    if (['ArrowUp', 'ArrowDown', 'Enter', 'Home', 'End', 'PageUp', 'PageDown', 'Tab'].includes(e.key)) {
                                                        e.stopPropagation();
                                                    }
                                                    // For other keys (alphanumeric, backspace), allow default and bubbling.
                                                    e.stopPropagation();
                                                }}
                                                className="h-8 text-xs w-full pl-8" // Padding for the icon
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
            </TooltipContent>
        </Tooltip>
    )
}
