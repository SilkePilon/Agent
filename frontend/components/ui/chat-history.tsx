"use client"

import { useState, useCallback, useMemo } from "react"
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
  RefreshCw,
  Search,
  Filter
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
  const [searchQuery, setSearchQuery] = useState("")
  const [filterMode, setFilterMode] = useState<'all' | 'chat' | 'agent'>('all')
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

  // Filter sessions based on search and filter criteria
  const filteredSessions = sessions.filter(session => {
    // Filter by mode
    if (filterMode !== 'all' && session.mode !== filterMode) {
      return false
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      return session.title.toLowerCase().includes(query) ||
        (session.modelId && session.modelId.toLowerCase().includes(query)) ||
        session.messages.some(msg =>
          msg.content.toLowerCase().includes(query)
        )
    }

    return true
  })

  // Group sessions by date
  const groupedSessions = filteredSessions.reduce((groups, session) => {
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
  }  // Shared content component for both Sheet and Drawer
  const ChatHistoryContent = useMemo(() => (
    <>      <div className="flex items-center justify-between px-6 py-4 border-b">
      <div className="flex items-center gap-2">
        <History className="size-5" />
        <span className="font-semibold">Chat History</span>
        {filteredSessions.length !== sessions.length && (
          <Badge variant="secondary" className="text-xs">
            {filteredSessions.length} of {sessions.length}
          </Badge>
        )}
      </div>
    </div>

      <ScrollArea className="flex-1 px-4">
        <div className="py-4 space-y-4">
          {/* New Chat Button */}
          <Button
            onClick={handleNewChat}
            className="w-full"
            size="sm"
          >
            <Plus className="size-4 mr-2" />
            New Chat
          </Button>
          {/* Search and Filter */}
          <div className="space-y-3 px-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={filterMode === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterMode('all')}
                className="flex-1"
              >
                All
              </Button>
              <Button
                variant={filterMode === 'chat' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterMode('chat')}
                className="flex-1"
              >
                <MessageSquare className="size-3 mr-1" />
                Chat
              </Button>
              <Button
                variant={filterMode === 'agent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterMode('agent')}
                className="flex-1"
              >
                <Bot className="size-3 mr-1" />
                Agent
              </Button>
            </div>
          </div>

          {/* Chat Sessions */}
          <div className="space-y-6">
            {Object.entries(groupedSessions).map(([groupName, groupSessions]) => (
              <div key={groupName}>
                <h3 className="text-xs font-medium text-muted-foreground mb-3 px-2">
                  {groupName}
                </h3>
                <div className="space-y-1">
                  {groupSessions.map((session) => (                    <motion.div
                      key={session.id}
                      initial={{ 
                        opacity: 0, 
                        ...(isMobile 
                          ? { y: 20 } 
                          : { x: -20 })
                      }}
                      animate={{ 
                        opacity: 1, 
                        ...(isMobile 
                          ? { y: 0 } 
                          : { x: 0 })
                      }}
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
                              <X className="size-3" />                          </Button>
                          </div>
                        </div>) : (
                        <>
                        <div className="flex items-start justify-between mb-0">
                          <h4 className="text-sm font-medium line-clamp-2 flex-1 mr-2">
                            {session.title}
                          </h4>
                          <div className="flex items-center gap-1 shrink-0">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    "h-6 w-6 p-0 transition-opacity",
                                    isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                  )}
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
                        </div>                          <div className="space-y-0.5">
                            <div className="flex items-center flex-wrap gap-1.5">
                              <div className="flex items-center gap-1.5 text-xs px-2 py-0.5 bg-muted/50 dark:bg-muted/30 border-2 border-border rounded-md w-fit">
                                {session.mode === 'agent' ? (
                                  <><Bot className="size-2.5 mr-1" />Agent</>
                                ) : (
                                  <><MessageSquare className="size-2.5 mr-1" />Chat</>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs px-2 py-1 bg-muted/50 dark:bg-muted/30 border-2 border-border rounded-md w-fit">
                                {renderProviderIcon(session.modelProvider)}
                                {session.modelId && (
                                  <span className="text-xs opacity-70">
                                    {session.modelId.split('-')[0].charAt(0).toUpperCase() + session.modelId.split('-')[0].slice(1)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs px-2 py-1 bg-muted/50 dark:bg-muted/30 border-2 border-border rounded-md w-fit">
                                {session.modelId && (
                                  <span className="text-xs opacity-70">
                                    {session.messages.length} message{session.messages.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground/70">
                              {formatTime(new Date(session.updatedAt))}
                            </div>
                          </div>
                        </>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>))}

            {filteredSessions.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="size-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  {searchQuery ? "No chats found" : "No chat history yet"}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {searchQuery ? "Try adjusting your search or filters" : "Start a conversation to see your chat history here"}
                </p>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </>
  ), [
    filteredSessions,
    sessions.length,
    searchQuery,
    filterMode,
    groupedSessions,
    editingSessionId,
    editTitle,
    currentSessionId,
    regeneratingTitleId,
    handleNewChat,
    handleLoadSession,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleDeleteSession,
    handleRegenerateTitle,
    renderProviderIcon,
    formatTime,
    setFilterMode,
    setSearchQuery
  ])
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
          <DrawerHeader>
            <DrawerTitle className="sr-only">Chat History</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col h-full">
            {ChatHistoryContent}
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
      <SheetContent side="left" className="w-96 p-0 flex flex-col">
        <SheetHeader className="sr-only">
          <SheetTitle>Chat History</SheetTitle>
        </SheetHeader>
        {ChatHistoryContent}
      </SheetContent>
    </Sheet>
  )
}
