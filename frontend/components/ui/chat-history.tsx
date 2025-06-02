"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  History, 
  MessageSquare, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Plus,
  MoreVertical,
  Bot,
  User,
  RefreshCw
} from "lucide-react"
import { Gemini, OpenRouter } from '@lobehub/icons'

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  getChatSessions, 
  deleteChatSession, 
  updateSessionTitle,
  regenerateSessionTitle,
  type ChatSession 
} from "@/lib/chat-history"

interface ChatHistoryProps {
  onLoadSession: (session: ChatSession) => void
  onNewChat: () => void
  currentSessionId?: string
  className?: string
}

export function ChatHistory({ 
  onLoadSession, 
  onNewChat, 
  currentSessionId, 
  className 
}: ChatHistoryProps) {
  const [sessions, setSessions] = useState<ChatSession[]>(() => getChatSessions())
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [regeneratingTitleId, setRegeneratingTitleId] = useState<string | null>(null)
  const isMobile = useIsMobile()

  const refreshSessions = useCallback(() => {
    setSessions(getChatSessions())
  }, [])

  const handleDeleteSession = useCallback((sessionId: string) => {
    deleteChatSession(sessionId)
    refreshSessions()
  }, [refreshSessions])

  const handleStartEdit = useCallback((session: ChatSession) => {
    setEditingSessionId(session.id)
    setEditTitle(session.title)
  }, [])

  const handleRegenerateTitle = useCallback(async (sessionId: string) => {
    setRegeneratingTitleId(sessionId)
    try {
      await regenerateSessionTitle(sessionId)
      refreshSessions()
    } catch (error) {
      console.error('Failed to regenerate title:', error)
    } finally {
      setRegeneratingTitleId(null)
    }
  }, [refreshSessions])

  const handleSaveEdit = useCallback(() => {
    if (editingSessionId && editTitle.trim()) {
      updateSessionTitle(editingSessionId, editTitle.trim())
      refreshSessions()
    }
    setEditingSessionId(null)
    setEditTitle("")
  }, [editingSessionId, editTitle, refreshSessions])

  const handleCancelEdit = useCallback(() => {
    setEditingSessionId(null)
    setEditTitle("")
  }, [])

  const handleLoadSession = useCallback((session: ChatSession) => {
    onLoadSession(session)
    setIsOpen(false)
  }, [onLoadSession])

  const handleNewChat = useCallback(() => {
    onNewChat()
    setIsOpen(false)
  }, [onNewChat])

  // Group sessions by date
  const groupedSessions = sessions.reduce((groups, session) => {
    const today = new Date()
    const sessionDate = new Date(session.updatedAt)
    
    let groupKey: string
    const diffDays = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      groupKey = "Today"
    } else if (diffDays === 1) {
      groupKey = "Yesterday"
    } else if (diffDays < 7) {
      groupKey = "This week"
    } else if (diffDays < 30) {
      groupKey = "This month"
    } else {
      groupKey = "Older"
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(session)
    
    return groups
  }, {} as Record<string, ChatSession[]>)
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date)
  }

  // Helper function to render provider icon
  const renderProviderIcon = (provider?: 'openrouter' | 'google') => {
    if (!provider) return null
    
    switch (provider) {
      case 'google':
        return <Gemini className="h-3.5 w-3.5 text-purple-600 shrink-0" />
      case 'openrouter':
        return <OpenRouter className="h-3.5 w-3.5 text-[#6467f2] shrink-0" />
      default:
        return null
    }
  }

  // Shared content component for both Sheet and Drawer
  const ChatHistoryContent = () => (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <History className="size-5" />
          <span className="font-semibold">Chat History</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleNewChat}
          className="h-8 px-2 shrink-0"
        >
          <Plus className="size-4 mr-1" />
          New
        </Button>
      </div>
      
      <ScrollArea className="flex-1 px-4">
        <div className="py-4 space-y-6">
          {Object.entries(groupedSessions).map(([groupName, groupSessions]) => (
            <div key={groupName}>
              <h3 className="text-xs font-medium text-muted-foreground mb-3 px-2">
                {groupName}
              </h3>
              <div className="space-y-1">
                {groupSessions.map((session) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "group relative rounded-lg border-2 p-3 cursor-pointer transition-all duration-200",
                      "hover:bg-accent/50 hover:border-accent-foreground/20",
                      currentSessionId === session.id && "bg-accent border-accent-foreground/30"
                    )}
                    onClick={() => handleLoadSession(session)}
                  >
                    {editingSessionId === session.id ? (
                      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit()
                            if (e.key === 'Escape') handleCancelEdit()
                          }}
                          className="h-7 text-sm"
                          autoFocus
                        />
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleSaveEdit}
                            className="h-6 w-6 p-0"
                          >
                            <Check className="size-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            className="h-6 w-6 p-0"
                          >
                            <X className="size-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-medium line-clamp-2 flex-1 mr-2 flex items-center gap-2">
                            {renderProviderIcon(session.modelProvider)}
                            {session.title}
                          </h4>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="size-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStartEdit(session)
                                }}
                              >
                                <Edit2 className="size-3 mr-2" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteSession(session.id)
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="size-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRegenerateTitle(session.id)
                                }}
                              >
                                <RefreshCw className="size-3 mr-2" />
                                Regenerate Title
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                              {session.mode === 'agent' ? (
                                <><Bot className="size-2.5 mr-1" />Agent</>
                              ) : (
                                <><MessageSquare className="size-2.5 mr-1" />Chat</>
                              )}
                            </Badge>
                            {session.modelId && (
                              <span className="text-xs opacity-70">
                                {session.modelId.split('-')[0]}
                              </span>
                            )}
                          </div>
                          <span>{formatTime(new Date(session.updatedAt))}</span>
                        </div>
                        
                        <div className="mt-2 text-xs text-muted-foreground">
                          {session.messages.length} message{session.messages.length !== 1 ? 's' : ''}
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
          
          {sessions.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="size-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground mb-2">No chat history yet</p>
              <p className="text-xs text-muted-foreground/70">
                Start a conversation to see your chat history here
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  )
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <Button 
            variant="outline" 
            size="icon"
            className={cn("shrink-0", className)}
            onClick={refreshSessions}
          >
            <History className="size-4" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="h-[85vh]">
          <div className="flex flex-col h-full">
            <DrawerHeader className="border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <DrawerTitle className="flex items-center gap-2">
                  <History className="size-5" />
                  Chat History
                </DrawerTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleNewChat}
                  className="h-8 px-2 shrink-0"
                >
                  <Plus className="size-4 mr-1" />
                  New
                </Button>
              </div>            </DrawerHeader>
            
            <ScrollArea className="flex-1 px-4">
              <div className="py-4 space-y-6">
                {Object.entries(groupedSessions).map(([groupName, groupSessions]) => (
                  <div key={groupName}>
                    <h3 className="text-xs font-medium text-muted-foreground mb-3 px-2">
                      {groupName}
                    </h3>
                    <div className="space-y-1">
                      {groupSessions.map((session) => (                        <div
                          key={session.id}
                          className={cn(
                            "group relative rounded-lg border-2 p-3 cursor-pointer transition-all duration-200",
                            "hover:bg-accent/50 hover:border-accent-foreground/20",
                            currentSessionId === session.id && "bg-accent border-accent-foreground/30"
                          )}
                          onClick={() => handleLoadSession(session)}
                        >
                          {editingSessionId === session.id ? (
                            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                              <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit()
                                  if (e.key === 'Escape') handleCancelEdit()
                                }}
                                className="h-7 text-sm"
                                autoFocus
                              />
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleSaveEdit}
                                  className="h-6 w-6 p-0"
                                >
                                  <Check className="size-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelEdit}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="size-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>                              <div className="flex items-start justify-between mb-2">                                <h4 className="text-sm font-medium line-clamp-2 flex-1 mr-2 flex items-center gap-2">
                                  {session.title}
                                  {regeneratingTitleId === session.id && (
                                    <RefreshCw className="size-3 animate-spin text-muted-foreground" />
                                  )}
                                </h4>                                {/* Inline action buttons for mobile */}
                                <div className="flex items-center gap-1 shrink-0">
                                  {renderProviderIcon(session.modelProvider)}
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 group border-2 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleStartEdit(session)
                                    }}
                                    aria-label="Rename"
                                  >
                                    <Edit2 className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 group border-2 hover:bg-green-50 hover:border-green-200 hover:text-green-600"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRegenerateTitle(session.id)
                                    }}
                                    disabled={regeneratingTitleId === session.id}
                                    aria-label="Regenerate Title"
                                  >
                                    <RefreshCw className={cn(
                                      "h-4 w-4 transition-transform duration-200",
                                      regeneratingTitleId === session.id 
                                        ? "animate-spin" 
                                        : "group-hover:scale-110 group-hover:rotate-180"
                                    )} />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 group border-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteSession(session.id)
                                    }}
                                    aria-label="Delete"
                                  >
                                    <Trash2 className="h-4 w-4 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                    {session.mode === 'agent' ? (
                                      <><Bot className="size-2.5 mr-1" />Agent</>
                                    ) : (
                                      <><MessageSquare className="size-2.5 mr-1" />Chat</>
                                    )}
                                  </Badge>
                                  {session.modelId && (
                                    <span className="text-xs opacity-70">
                                      {session.modelId.split('-')[0]}
                                    </span>
                                  )}
                                </div>
                                <span>{formatTime(new Date(session.updatedAt))}</span>
                              </div>
                              
                              <div className="mt-2 text-xs text-muted-foreground">
                                {session.messages.length} message{session.messages.length !== 1 ? 's' : ''}
                              </div>
                            </>
                          )}                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {sessions.length === 0 && (
                  <div className="text-center py-12">
                    <MessageSquare className="size-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">No chat history yet</p>
                    <p className="text-xs text-muted-foreground/70">
                      Start a conversation to see your chat history here
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className={cn("shrink-0", className)}
          onClick={refreshSessions}
        >
          <History className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <History className="size-5" />
              Chat History
            </SheetTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleNewChat}
              className="h-8 px-2 shrink-0"
            >
              <Plus className="size-4 mr-1" />
              New
            </Button>
          </div>        </SheetHeader>
        
        <ScrollArea className="flex-1 px-4">
          <div className="py-4 space-y-6">
            {Object.entries(groupedSessions).map(([groupName, groupSessions]) => (
              <div key={groupName}>
                <h3 className="text-xs font-medium text-muted-foreground mb-3 px-2">
                  {groupName}
                </h3>
                <div className="space-y-1">
                  {groupSessions.map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "group relative rounded-lg border-2 p-3 cursor-pointer transition-all duration-200",
                        "hover:bg-accent/50 hover:border-accent-foreground/20",
                        currentSessionId === session.id && "bg-accent border-accent-foreground/30"
                      )}
                      onClick={() => handleLoadSession(session)}
                    >
                      {editingSessionId === session.id ? (
                        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit()
                              if (e.key === 'Escape') handleCancelEdit()
                            }}
                            className="h-7 text-sm"
                            autoFocus
                          />
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleSaveEdit}
                              className="h-6 w-6 p-0"
                            >
                              <Check className="size-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                              className="h-6 w-6 p-0"
                            >
                              <X className="size-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-sm font-medium line-clamp-2 flex-1 mr-2 flex items-center gap-2">
                              {renderProviderIcon(session.modelProvider)}
                              {session.title}
                            </h4>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="size-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleStartEdit(session)
                                  }}
                                >
                                  <Edit2 className="size-3 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteSession(session.id)
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="size-3 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRegenerateTitle(session.id)
                                  }}
                                >
                                  <RefreshCw className="size-3 mr-2" />
                                  Regenerate Title
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                {session.mode === 'agent' ? (
                                  <><Bot className="size-2.5 mr-1" />Agent</>
                                ) : (
                                  <><MessageSquare className="size-2.5 mr-1" />Chat</>
                                )}
                              </Badge>
                              {session.modelId && (
                                <span className="text-xs opacity-70">
                                  {session.modelId.split('-')[0]}
                                </span>
                              )}
                            </div>
                            <span>{formatTime(new Date(session.updatedAt))}</span>
                          </div>
                          
                          <div className="mt-2 text-xs text-muted-foreground">
                            {session.messages.length} message{session.messages.length !== 1 ? 's' : ''}
                          </div>
                        </>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
            
            {sessions.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="size-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground mb-2">No chat history yet</p>
                <p className="text-xs text-muted-foreground/70">
                  Start a conversation to see your chat history here
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
