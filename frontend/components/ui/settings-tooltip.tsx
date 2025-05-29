"use client"

import * as React from "react"
import { Bot, MessageCircle, Settings } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface SettingsTooltipProps {
  mode?: 'agent' | 'chat'
  setMode?: (mode: 'agent' | 'chat') => void
  provider?: 'openrouter' | 'google'
  selectedModel?: string
  children: React.ReactNode
}

export function SettingsTooltip({
  mode,
  setMode,
  provider,
  selectedModel,
  children,
}: SettingsTooltipProps) {
  const getCurrentProvider = () => {
    if (provider === 'google') return 'Google Gemini'
    return 'OpenRouter'
  }

  const getCurrentModel = () => {
    if (provider === 'google') return 'Gemini 2.5 Flash'
    return selectedModel?.split('/').pop()?.split(':')[0] || 'Default'
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>      <TooltipContent 
        side="left" 
        className="w-64 p-0 bg-background border border-border shadow-lg rounded-lg overflow-hidden"
        sideOffset={8}
      >
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2 text-sm font-medium">
            <Settings className="h-4 w-4" />
            Settings
          </div>

          {/* Mode Switch */}
          {mode && setMode && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Mode</div>              <div className="flex gap-1">
                <Button
                  variant={mode === 'agent' ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "flex-1 h-8 text-xs transition-all duration-200",
                    mode === 'agent' 
                      ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm" 
                      : "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
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
                      : "hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                  )}
                  onClick={() => setMode('chat')}
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Chat
                </Button>
              </div>
            </div>
          )}

          {/* Current Configuration */}
          <div className="space-y-2 pt-2 border-t">
            <div className="text-xs text-muted-foreground">Current Setup</div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs">Provider:</span>
                <Badge variant="secondary" className="text-xs">
                  {getCurrentProvider()}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">Model:</span>
                <Badge variant="outline" className="text-xs max-w-24 truncate">
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
