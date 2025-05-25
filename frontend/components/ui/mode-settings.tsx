"use client"

import * as React from "react"
import { Bot, MessageCircle, Settings, Search, Loader2, Zap, Brain } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { getAllModels, formatPrice, type ModelOption } from "@/lib/models"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"

interface ModeSettingsProps {
  mode?: 'agent' | 'chat'
  setMode?: (mode: 'agent' | 'chat') => void
  provider?: 'openrouter' | 'google'
  setProvider?: (provider: 'openrouter' | 'google') => void
  selectedModel?: string
  setSelectedModel?: (model: string) => void
  children: React.ReactNode
}

export function ModeSettings({
  mode,
  setMode,
  provider,
  setProvider,
  selectedModel,
  setSelectedModel,
  children,
}: ModeSettingsProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {children}
        </DrawerTrigger>        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Mode Settings
            </DrawerTitle>
            <p className="text-sm text-muted-foreground">
              Choose how the AI assistant should respond to your messages.
            </p>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto">
            <ModeSettingsContent
              mode={mode}
              setMode={setMode}
              provider={provider}
              setProvider={setProvider}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
            />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Mode Settings
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose how the AI assistant should respond to your messages.
          </p>
        </DialogHeader>
        <ModeSettingsContent
          mode={mode}
          setMode={setMode}
          provider={provider}
          setProvider={setProvider}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
        />
      </DialogContent>
    </Dialog>
  )
}

interface ModeSettingsContentProps {
  mode?: 'agent' | 'chat'
  setMode?: (mode: 'agent' | 'chat') => void
  provider?: 'openrouter' | 'google'
  setProvider?: (provider: 'openrouter' | 'google') => void
  selectedModel?: string
  setSelectedModel?: (model: string) => void
}

function ModeSettingsContent({
  mode,
  setMode,
  provider,
  setProvider,
  selectedModel,
  setSelectedModel,
}: ModeSettingsContentProps) {
  const [availableModels, setAvailableModels] = React.useState<ModelOption[]>([])
  const [modelSearchQuery, setModelSearchQuery] = React.useState("")
  const [isLoadingModels, setIsLoadingModels] = React.useState(false)

  // Load available models on mount
  React.useEffect(() => {
    const loadModels = async () => {
      setIsLoadingModels(true)
      try {
        const models = await getAllModels()
        setAvailableModels(models)
      } catch (error) {
        console.error('Failed to load models:', error)
      } finally {
        setIsLoadingModels(false)
      }
    }
    
    loadModels()
  }, [])

  // Filter models based on search query
  const filteredModels = React.useMemo(() => {
    if (!modelSearchQuery.trim()) return availableModels

    return availableModels.filter(model =>
      model.name.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
      model.id.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
      model.description?.toLowerCase().includes(modelSearchQuery.toLowerCase())
    )
  }, [availableModels, modelSearchQuery])
  return (
    <div className="space-y-8">
      {/* Mode Selection */}
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2">
          <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
          <h4 className="font-semibold text-lg">Conversation Mode</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">          <motion.div 
            className={cn(
              "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 group overflow-hidden",
              mode === 'chat' 
                ? "border-green-500 bg-green-50 dark:bg-green-950/30" 
                : "border-border hover:border-green-300 hover:bg-muted/50"
            )}
            onClick={() => setMode?.('chat')}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative flex items-start gap-4">
              <motion.div 
                className={cn(
                  "p-3 rounded-lg transition-all duration-300",
                  mode === 'chat' 
                    ? "bg-green-500 text-white" 
                    : "bg-muted group-hover:bg-green-100 group-hover:text-green-600"
                )}
                whileHover={{ rotate: 5 }}
              >
                <MessageCircle className="h-6 w-6" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-base">Chat Mode</span>
                  <AnimatePresence>
                    {mode === 'chat' && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <Badge variant="default" className="text-xs bg-green-500">
                          Active
                        </Badge>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Natural conversation without external tools. Perfect for casual chat, questions, and explanations.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Zap className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">Fast responses</span>
                </div>
              </div>
            </div>
          </motion.div>
            <motion.div 
            className={cn(
              "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 group overflow-hidden",
              mode === 'agent' 
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" 
                : "border-border hover:border-blue-300 hover:bg-muted/50"
            )}
            onClick={() => setMode?.('agent')}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative flex items-start gap-4">
              <motion.div 
                className={cn(
                  "p-3 rounded-lg transition-all duration-300",
                  mode === 'agent' 
                    ? "bg-blue-500 text-white" 
                    : "bg-muted group-hover:bg-blue-100 group-hover:text-blue-600"
                )}
                whileHover={{ rotate: -5 }}
              >
                <Bot className="h-6 w-6" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-base">Agent Mode</span>
                  <AnimatePresence>
                    {mode === 'agent' && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <Badge variant="default" className="text-xs bg-blue-500">
                          Active
                        </Badge>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Advanced AI with tools for calculations, code generation, file management, and complex multi-step tasks.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Brain className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-blue-600 font-medium">Advanced capabilities</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>      {/* Provider and Model Selection */}
      <motion.div 
        className="space-y-6 border-t pt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex items-center gap-2">
          <div className="h-8 w-1 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
          <h4 className="font-semibold text-lg">AI Provider</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div 
            className={cn(
              "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 group overflow-hidden",
              provider === 'google' 
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" 
                : "border-border hover:border-emerald-300 hover:bg-muted/50"
            )}
            onClick={() => {
              setProvider?.('google')
              setSelectedModel?.('gemini-2.5-flash-preview-05-20')
            }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-base">Google Gemini</span>
                <AnimatePresence>
                  {provider === 'google' && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <Badge variant="default" className="text-xs bg-emerald-500">
                        Active
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Latest Gemini 2.5 Flash Preview model with advanced reasoning capabilities and fast response times.
              </p>
              <div className="mt-3 px-3 py-2 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground">Fixed Model</p>
                <p className="text-xs text-foreground">Gemini 2.5 Flash Preview</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className={cn(
              "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 group overflow-hidden",
              provider === 'openrouter' 
                ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30" 
                : "border-border hover:border-orange-300 hover:bg-muted/50"
            )}
            onClick={() => setProvider?.('openrouter')}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-base">OpenRouter</span>
                <AnimatePresence>
                  {provider === 'openrouter' && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <Badge variant="default" className="text-xs bg-orange-500">
                        Active
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Access to multiple state-of-the-art AI models with transparent pricing and performance metrics.
              </p>
              <div className="mt-3 px-3 py-2 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground">Multiple Models</p>
                <p className="text-xs text-foreground">Choose from various providers</p>
              </div>
            </div>
          </motion.div>
        </div>        {/* Model Selection for OpenRouter */}
        <AnimatePresence>
          {provider === 'openrouter' && (
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2">
                <div className="h-6 w-1 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
                <h4 className="font-semibold">Select Model</h4>
              </div>
              
              {/* Search Input */}
              <motion.div 
                className="relative"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search models..."
                  value={modelSearchQuery}
                  onChange={(e) => setModelSearchQuery(e.target.value)}
                  className="pl-10 h-11 border-2 focus:border-blue-500 transition-colors"
                />
              </motion.div>

              {/* Model List */}
              <motion.div 
                className="max-h-64 overflow-y-auto space-y-2 border-2 border-muted rounded-xl p-3 bg-muted/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {isLoadingModels ? (
                  <motion.div 
                    className="flex items-center justify-center py-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="h-6 w-6 text-blue-500" />
                    </motion.div>
                    <span className="ml-3 text-sm text-muted-foreground">Loading models...</span>
                  </motion.div>
                ) : filteredModels.length === 0 ? (
                  <motion.div 
                    className="text-center py-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <p className="text-sm text-muted-foreground">
                      {modelSearchQuery ? 'No models found matching your search.' : 'No models available.'}
                    </p>
                  </motion.div>
                ) : (
                  <AnimatePresence>
                    {filteredModels.map((model, index) => (
                      <motion.div
                        key={model.id}
                        className={cn(
                          "p-3 rounded-lg cursor-pointer transition-all duration-200 border",
                          selectedModel === model.id 
                            ? "bg-blue-50 dark:bg-blue-950/50 border-blue-500" 
                            : "hover:bg-muted/50 border-transparent hover:border-muted-foreground/20"
                        )}
                        onClick={() => setSelectedModel?.(model.id)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-sm truncate">{model.name}</span>
                              <AnimatePresence>
                                {selectedModel === model.id && (
                                  <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                  >
                                    <Badge variant="default" className="text-xs bg-blue-500 shrink-0">
                                      Selected
                                    </Badge>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                            {model.description && (
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2 leading-relaxed">
                                {model.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 flex-wrap">
                              {model.pricing && (
                                <div className="flex items-center gap-3 text-xs bg-muted/50 px-2 py-1 rounded-md">
                                  <span className="text-muted-foreground">Input:</span>
                                  <span className="font-mono font-medium">{formatPrice(model.pricing.prompt)}</span>
                                  <span className="text-muted-foreground">Output:</span>
                                  <span className="font-mono font-medium">{formatPrice(model.pricing.completion)}</span>
                                </div>
                              )}
                              {model.contextLength && (
                                <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                                  {model.contextLength.toLocaleString()} tokens
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Selection Info */}
        <motion.div 
          className="p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="font-medium text-sm">Current Configuration</span>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Provider:</span> {provider === 'google' ? 'Google Gemini' : 'OpenRouter'} • 
            <span className="font-medium"> Model:</span>{' '}
            {provider === 'google' 
              ? 'Gemini 2.5 Flash Preview' 
              : `${availableModels.find(m => m.id === selectedModel)?.name || selectedModel || 'No model selected'}`
            }
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
