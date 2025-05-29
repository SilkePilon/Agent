"use client"

import * as React from "react"
import { Bot, MessageCircle, Settings, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { getAllModels, type ModelOption } from "@/lib/models"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

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
  const [availableModels, setAvailableModels] = React.useState<ModelOption[]>([])

  React.useEffect(() => {
    if (provider === 'openrouter') {
      getAllModels().then(setAvailableModels)
    }
  }, [provider])

  const getCurrentProvider = () => {
    if (provider === 'google') return 'Google Gemini'
    return 'OpenRouter'
  }

  const getCurrentModel = () => {
    if (provider === 'google') return 'Gemini 2.5 Flash'
    if (provider === 'openrouter' && selectedModel) {
      const model = availableModels.find(m => m.id === selectedModel)
      return model?.name || selectedModel.split('/').pop()?.split(':')[0] || 'Default'
    }
    return 'Default'
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>      <TooltipContent 
        side="top" 
        className="w-80 p-0 bg-background border border-border shadow-md rounded-lg overflow-hidden"
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
              <div className="flex gap-1">
                <Button
                  variant={provider === 'google' ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "flex-1 h-8 text-xs transition-all duration-200",
                    provider === 'google' 
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                      : "hover:bg-muted text-foreground"
                  )}
                  onClick={() => setProvider?.('google')}
                >
                  Gemini
                </Button>
                <Button
                  variant={provider === 'openrouter' ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "flex-1 h-8 text-xs transition-all duration-200",
                    provider === 'openrouter' 
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                      : "hover:bg-muted text-foreground"
                  )}
                  onClick={() => setProvider?.('openrouter')}
                >
                  OpenRouter
                </Button>
              </div>
            </div>
          )}

          {/* Model Selection for OpenRouter */}
          {provider === 'openrouter' && setSelectedModel && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Model</div>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id} className="text-xs">
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-foreground">{model.name}</span>
                        {model.description && (
                          <span className="text-muted-foreground text-xs truncate max-w-64">
                            {model.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
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
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground">Model:</span>
                <Badge variant="outline" className="text-xs max-w-32 truncate">
                  {getCurrentModel()}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
