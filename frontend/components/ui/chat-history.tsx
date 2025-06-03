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
  Filter, ChevronDown,
  ChevronUp,
  FileText,
  Download,
  Image,
  File,
  FileCode,
  FileArchive,
  Settings
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
  clearAllChatHistory,
  type ChatSession,
  type ExtendedMessage
} from "@/lib/chat-history"

// Attachment interface to match the one used in messages
interface Attachment {
  name?: string
  contentType?: string
  url: string
}

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
  const [openFilePanels, setOpenFilePanels] = useState<Record<string, boolean>>({});
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)
  const [isClearingAll, setIsClearingAll] = useState(false)
  const isMobile = useIsMobile()

  const refreshSessions = useCallback(() => {
    setSessions(getChatSessions())
  }, [])
  const handleDeleteSession = useCallback(async (sessionId: string) => {
    setDeletingSessionId(sessionId)
    // Wait for animation to complete before actually deleting
    await new Promise(resolve => setTimeout(resolve, 300))
    deleteChatSession(sessionId)
    setDeletingSessionId(null)
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
  const handleClearAll = useCallback(async () => {
    setIsClearingAll(true)
    // Wait for animation to complete before actually clearing
    await new Promise(resolve => setTimeout(resolve, 500))
    clearAllChatHistory()
    setIsClearingAll(false)
    refreshSessions()
  }, [refreshSessions])

  const toggleFilePanel = useCallback((sessionId: string) => {
    setOpenFilePanels(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  }, []);
  // Get appropriate file icon based on file type
  const getFileIcon = (contentType: string, fileName: string) => {
    // For real attachments, use contentType
    if (contentType && contentType !== 'unknown') {
      if (contentType.startsWith('image/')) {
        return <Image className="size-3 shrink-0 text-blue-500" />
      }
      if (contentType.includes('pdf')) {
        return <FileText className="size-3 shrink-0 text-red-500" />
      }
      if (contentType.includes('text/') || contentType.includes('json') || contentType.includes('javascript') || contentType.includes('typescript')) {
        return <FileCode className="size-3 shrink-0 text-green-500" />
      }
      if (contentType.includes('zip') || contentType.includes('rar') || contentType.includes('tar') || contentType.includes('gzip')) {
        return <FileArchive className="size-3 shrink-0 text-purple-500" />
      }
    }

    // Fallback to file extension
    const extension = fileName.split('.').pop()?.toLowerCase()
    if (extension) {
      if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'].includes(extension)) {
        return <Image className="size-3 shrink-0 text-blue-500" />
      }
      if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'md'].includes(extension)) {
        return <FileText className="size-3 shrink-0 text-red-500" />
      }
      if (['js', 'ts', 'jsx', 'tsx', 'json', 'html', 'css', 'scss', 'sass', 'less', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'php', 'rb', 'swift', 'kt'].includes(extension)) {
        return <FileCode className="size-3 shrink-0 text-green-500" />
      }
      if (['zip', 'rar', 'tar', 'gz', '7z', 'bz2', 'xz'].includes(extension)) {
        return <FileArchive className="size-3 shrink-0 text-purple-500" />
      }
    }

    // Default file icon
    return <File className="size-3 shrink-0 text-gray-500" />
  }

  // Handle file download
  const handleFileDownload = useCallback((file: { name: string; url: string | null; type: string }) => {
    if (file.url) {
      // Handle real file attachments (data URLs)
      try {
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Failed to download file:', error);
        alert('Failed to download file. The file may no longer be available.');
      }
    } else {
      // Fallback for text-based file references (no actual file)
      alert(`File "${file.name}" was mentioned in the chat but no actual file attachment is available for download.`);
    }
  }, []);
  // Extract actual file attachments from message
  const extractFileReferences = (message: ExtendedMessage) => {
    // Check for real file attachments first
    if (message.experimental_attachments && message.experimental_attachments.length > 0) {
      return message.experimental_attachments.map((attachment, index) => ({
        name: attachment.name || `Attachment ${index + 1}`,
        type: attachment.contentType || 'unknown',
        url: attachment.url,
        id: `attachment-${message.id}-${index}`
      }));
    }

    // Fallback: Simple heuristic to extract potential file references from message content
    const fileRegex = /(uploaded|attached|sent) (\w+\.\w+)/gi;
    const content = typeof message.content === 'string' ? message.content : '';

    const matches = [...content.matchAll(fileRegex)];
    const files = matches.map(match => ({
      name: match[2],
      type: match[2].split('.').pop()?.toLowerCase() || 'unknown',
      url: null, // No actual file URL for text-based matches
      id: `file-${Math.random().toString(36).substring(2, 11)}`
    }));

    return files;
  }
  // Check if a session has any file attachments
  const sessionHasFiles = (session: ChatSession) => {
    return session.messages.some(msg => {
      const files = extractFileReferences(msg);
      return files.length > 0;
    });
  }

  // Get file count and type for a session
  const getSessionFileInfo = (session: ChatSession) => {
    let totalFiles = 0;
    let downloadableFiles = 0;

    session.messages.forEach(msg => {
      const files = extractFileReferences(msg);
      totalFiles += files.length;
      downloadableFiles += files.filter(f => f.url).length;
    });

    return { totalFiles, downloadableFiles };
  }

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
        <div className="py-4 space-y-4">          {/* New Chat Button */}
          <Button
            onClick={handleNewChat}
            className="w-full h-8 text-xs transition-all duration-200 bg-green-500 hover:bg-green-600 text-white shadow-sm"
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
            </div>            <div className="flex gap-1">
              <Button
                variant={filterMode === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterMode('all')}
                className={cn(
                  "flex-1 h-8 text-xs transition-all duration-200",
                  filterMode === 'all'
                    ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                    : "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-foreground border-2"
                )}
              >
                All
              </Button>
              <Button
                variant={filterMode === 'chat' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterMode('chat')}
                className={cn(
                  "flex-1 h-8 text-xs transition-all duration-200",
                  filterMode === 'chat'
                    ? "bg-green-500 hover:bg-green-600 text-white shadow-sm"
                    : "hover:bg-green-50 hover:text-green-600 hover:border-green-200 text-foreground border-2"
                )}
              >
                <MessageSquare className="size-3 mr-1" />
                Chat
              </Button>
              <Button
                variant={filterMode === 'agent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterMode('agent')}
                className={cn(
                  "flex-1 h-8 text-xs transition-all duration-200",
                  filterMode === 'agent'
                    ? "bg-purple-500 hover:bg-purple-600 text-white shadow-sm"
                    : "hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 text-foreground border-2"
                )}
              >
                <Bot className="size-3 mr-1" />
                Agent
              </Button>
            </div>
          </div>          {/* Chat Sessions */}
          <motion.div 
            className="space-y-6"
            animate={{
              opacity: isClearingAll ? 0 : 1,
              x: isClearingAll ? -100 : 0
            }}
            transition={{ duration: 0.5 }}
          >
            {Object.entries(groupedSessions).map(([groupName, groupSessions]) => (
              <div key={groupName}>
                <h3 className="text-xs font-medium text-muted-foreground mb-3 px-2">
                  {groupName}
                </h3>
                <div className="space-y-1">                  {groupSessions.map((session) => (<motion.div
                    key={session.id}
                    initial={{
                      opacity: 0,
                      ...(isMobile
                        ? { y: 20 }
                        : { x: -20 })
                    }}
                    animate={{
                      opacity: (deletingSessionId === session.id || isClearingAll) ? 0 : 1,
                      ...(isMobile
                        ? { y: (deletingSessionId === session.id || isClearingAll) ? -20 : 0 }
                        : { x: (deletingSessionId === session.id || isClearingAll) ? -100 : 0 })
                    }}
                    transition={{ duration: deletingSessionId === session.id ? 0.3 : isClearingAll ? 0.5 : 0.3 }}
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
                        />                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleSaveEdit}
                            className="h-6 w-6 p-0 hover:bg-green-50 hover:text-green-600 transition-all duration-200"
                          >
                            <Check className="size-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                          >
                            <X className="size-3" />                          </Button>
                        </div>
                      </div>) : (
                      <>
                        <div className="flex items-start justify-between mb-0">
                          <h4 className="text-sm font-medium line-clamp-2 flex-1 mr-2">
                            {session.title}
                          </h4>
                          <div className="flex items-center gap-1 shrink-0">                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <div className="flex items-center text-xs px-1 py-0.5 bg-muted/50 dark:bg-muted/30 border border-border hover:border-primary/50 rounded-md w-fit transition-all duration-200">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Settings className="size-3 transition-transform duration-300 hover:rotate-90" />
                                </Button>
                                </div>
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
                          <br></br>
                          <div className="text-xs text-muted-foreground/70">
                            <div className="flex justify-between items-center">
                              <span>{formatTime(new Date(session.updatedAt))}</span>
                              {sessionHasFiles(session) && (
                                <button
                                  className="text-xs text-muted-foreground/70 hover:text-foreground flex items-center gap-1 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFilePanel(session.id);
                                  }}
                                >
                                  <FileText className="size-3" />
                                  <span>
                                    {(() => {
                                      const { totalFiles, downloadableFiles } = getSessionFileInfo(session);
                                      if (downloadableFiles > 0) {
                                        return `${downloadableFiles} attachment${downloadableFiles > 1 ? 's' : ''}${totalFiles > downloadableFiles ? ` (+${totalFiles - downloadableFiles} ref${totalFiles - downloadableFiles > 1 ? 's' : ''})` : ''}`;
                                      } else {
                                        return `${totalFiles} file ref${totalFiles > 1 ? 's' : ''}`;
                                      }
                                    })()}                                  </span>
                                  <motion.div
                                    animate={{ rotate: openFilePanels[session.id] ? 180 : 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                  >
                                    <ChevronDown className="size-3" />
                                  </motion.div>
                                </button>
                              )}
                            </div>
                                <AnimatePresence>
                              {sessionHasFiles(session) && openFilePanels[session.id] && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ 
                                    duration: 0.3, 
                                    ease: "easeInOut",
                                    opacity: { duration: 0.2 }
                                  }}
                                  className="mt-2 space-y-1 max-h-24 overflow-hidden"
                                >
                                  <div className="overflow-y-auto max-h-24">
                                    {session.messages.map(msg => {
                                      const files = extractFileReferences(msg);                                      return files.map(file => (<motion.div 
                                        key={file.id} 
                                        initial={{ x: -10, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.1, duration: 0.2 }}
                                        className="flex items-center justify-between py-1 px-2 bg-muted/30 rounded text-xs gap-2"
                                      >
                                        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                                          <div className="shrink-0">
                                            {getFileIcon(file.type, file.name)}
                                          </div>
                                          <span className="truncate text-xs" title={file.name}>{file.name}</span>
                                          {file.url && (
                                            <Badge variant="secondary" className="text-[10px] px-1 py-0 shrink-0">
                                              Downloadable
                                            </Badge>
                                          )}
                                        </div><Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 shrink-0 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 border border-border rounded-sm"
                                          title="Download file"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleFileDownload(file);
                                          }}
                                        >
                                          <Download className="size-3" />
                                        </Button>
                                      </motion.div>
                                      ));
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
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
                  {searchQuery ? "Try adjusting your search or filters" : "Start a conversation to see your chat history here"}                </p>
              </div>            )}          </motion.div>
        </div>
      </ScrollArea>
      
      {/* Clear All Button */}
      {sessions.length > 0 && (
        <div className="px-6 py-4 border-t">
          <Button
            onClick={handleClearAll}
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs transition-all duration-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-foreground border-2"
          >
            <Trash2 className="size-4 mr-2" />
            Clear All
          </Button>
        </div>
      )}
    </>
  ), [
    filteredSessions,
    sessions.length,
    searchQuery,
    filterMode,
    groupedSessions,    editingSessionId,
    editTitle,
    currentSessionId,
    regeneratingTitleId,
    deletingSessionId,
    isClearingAll,
    handleNewChat,
    handleLoadSession,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleDeleteSession,
    handleRegenerateTitle,
    handleClearAll,
    renderProviderIcon,
    formatTime,
    setFilterMode,
    setSearchQuery, openFilePanels,
    toggleFilePanel,
    sessionHasFiles,
    extractFileReferences
  ])
  if (isMobile) {
    return (      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={cn("shrink-0 h-8 text-xs transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border-2", className)}
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

  return (    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn("shrink-0 h-8 text-xs transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border-2", className)}
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
