"use client"

import React, { useMemo, useState } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import { Ban, ChevronRight, Code2, Loader2, Terminal, Bot, ArrowRight } from "lucide-react"
import { Gemini, OpenRouter } from '@lobehub/icons'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { FilePreview } from "@/components/ui/file-preview"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { AnimatedMarkdown } from 'flowtoken';
import 'flowtoken/dist/styles.css';
import githubLight from 'shiki/themes/github-light.mjs';

const chatBubbleVariants = cva(
  "group/message relative break-words rounded-lg p-3 text-sm max-w-[min(70%,theme(maxWidth.2xl))] w-fit",
  {
    variants: {
      isUser: {
        true: "",
        false: "bg-muted text-foreground",
      },
      mode: {
        agent: "",
        chat: "",
        undefined: "",
      },
      animation: {
        none: "",
        slide: "duration-300 animate-in fade-in-0",
        scale: "duration-300 animate-in fade-in-0 zoom-in-75",
        fade: "duration-500 animate-in fade-in-0",
      },
    },
    compoundVariants: [
      // User message styling based on mode
      {
        isUser: true,
        mode: "agent",
        class: "bg-blue-500 text-white",
      },
      {
        isUser: true,
        mode: "chat",
        class: "bg-primary text-primary-foreground",
      },
      {
        isUser: true,
        mode: undefined,
        class: "bg-primary text-primary-foreground",
      },
      // Animation variants
      {
        isUser: true,
        animation: "slide",
        class: "slide-in-from-right",
      },
      {
        isUser: false,
        animation: "slide",
        class: "slide-in-from-left",
      },
      {
        isUser: true,
        animation: "scale",
        class: "origin-bottom-right",
      },
      {
        isUser: false,
        animation: "scale",
        class: "origin-bottom-left",
      },
    ],
  }
)

type Animation = VariantProps<typeof chatBubbleVariants>["animation"]

interface Attachment {
  name?: string
  contentType?: string
  url: string
}

interface PartialToolCall {
  state: "partial-call"
  toolName: string
}

interface ToolCall {
  state: "call"
  toolName: string
}

interface ToolResult {
  state: "result"
  toolName: string
  result: {
    __cancelled?: boolean
    [key: string]: unknown
  }
}

type ToolInvocation = PartialToolCall | ToolCall | ToolResult

interface ReasoningPart {
  type: "reasoning"
  reasoning: string
}

interface ToolInvocationPart {
  type: "tool-invocation"
  toolInvocation: ToolInvocation
}

interface TextPart {
  type: "text"
  text: string
}

// For compatibility with AI SDK types, not used
interface SourcePart {
  type: "source"
}

export type MessagePart = TextPart | ReasoningPart | ToolInvocationPart | SourcePart

export interface Message {
  id: string
  role: "user" | "assistant" | (string & {})
  content: string
  createdAt?: Date
  experimental_attachments?: Attachment[]
  toolInvocations?: ToolInvocation[]
  parts?: MessagePart[]
  modelId?: string
  modelProvider?: 'openrouter' | 'google'
}

export interface ChatMessageProps extends Message {
  showTimeStamp?: boolean
  animation?: Animation
  actions?: React.ReactNode
  mode?: 'agent' | 'chat'
  setMode?: (mode: 'agent' | 'chat') => void
  append?: (message: { role: "user"; content: string }) => void
  messageActionsAlwaysVisible?: boolean
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  createdAt,
  showTimeStamp = false,
  animation = "scale",
  actions,
  experimental_attachments,
  toolInvocations,
  parts,
  mode,
  setMode,
  append,
  modelId,
  modelProvider,
  messageActionsAlwaysVisible = false,
}) => {
  const files = useMemo(() => {
    return experimental_attachments?.map((attachment) => {
      const dataArray = dataUrlToUint8Array(attachment.url)
      const file = new File([dataArray], attachment.name ?? "Unknown")
      return file
    })
  }, [experimental_attachments])

  const isUser = role === "user"

  const formattedTime = createdAt?.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

  if (isUser) {
    return (
      <div
        className={cn("flex flex-col w-full max-w-full overflow-x-hidden", isUser ? "items-end pr-4" : "items-start pl-4")}
      >
        {files ? (
          <div className="mb-1 flex flex-wrap gap-2">
            {files.map((file, index) => {
              return <FilePreview file={file} key={index} />
            })}
          </div>
        ) : null}

        <div className={cn(chatBubbleVariants({ isUser, animation, mode }))}>
          <MarkdownRenderer>{content}</MarkdownRenderer>
        </div>

        {showTimeStamp && createdAt ? (
          <time
            dateTime={createdAt.toISOString()}
            className={cn(
              "mt-1 block px-1 text-xs opacity-50",
              animation !== "none" && "duration-500 animate-in fade-in-0"
            )}
          >
            {formattedTime}
          </time>
        ) : null}
      </div>
    )
  }

  // Assistant message rendering
  return (
    <div className={cn("flex flex-col w-full max-w-full overflow-x-hidden items-start pl-4")}>
      {/* Main content bubble with AnimatedMarkdown */}
      {(content || (parts && parts.some(p => p.type === 'text'))) && (
        <div className={cn(chatBubbleVariants({ isUser, animation, mode }))}>
          <div className="prose dark:prose-invert lg:prose-md prose-pre:m-0">
            <AnimatedMarkdown
              content={content} // Always use the main content prop for streaming
              animation="typewriter"
              sep="char"
              animationDuration="0.15s"
              animationTimingFunction="linear"
              codeStyle={githubLight}
              customComponents={flowtokenCustomComponents}
            />
          </div>
          {!isUser && role === "assistant" && (
            <ModelBadge modelProvider={modelProvider} modelId={modelId} />
          )}
          {actions && (
            <div className={cn(
              "absolute -bottom-4 right-2 flex space-x-1 rounded-lg border bg-background p-1 text-foreground transition-opacity",
              messageActionsAlwaysVisible
                ? "opacity-100"
                : "opacity-0 group-hover/message:opacity-100"
            )}>
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Render non-text parts like tool calls and reasoning blocks */}
      {parts && parts.length > 0 && parts.map((part, index) => {
        if (part.type === "reasoning") {
          return <ReasoningBlock key={`reasoning-${index}`} part={part} />;
        } else if (part.type === "tool-invocation") {
          return (
            <ToolCall
              key={`tool-${index}`}
              toolInvocations={[part.toolInvocation]}
              mode={mode}
              setMode={setMode}
              append={append}
            />
          );
        }
        return null;
      })}

      {/* Render toolInvocations if they exist and are not part of `parts` */}
      {toolInvocations && (!parts || !parts.some(p => p.type === 'tool-invocation')) && toolInvocations.length > 0 && (
         <ToolCall toolInvocations={toolInvocations} mode={mode} setMode={setMode} append={append} />
      )}

      {showTimeStamp && createdAt && (
        <time
          dateTime={createdAt.toISOString()}
          className={cn(
            "mt-1 block px-1 text-xs opacity-50",
            animation !== "none" && "duration-500 animate-in fade-in-0"
          )}
        >
          {formattedTime}
        </time>
      )}
    </div>
  );
}

const flowtokenCustomComponents = {
  h1: ({ animateText, node, children, ...props }: any) => animateText(React.createElement('h1', { className: 'text-2xl font-semibold', ...props }, children)),
  h2: ({ animateText, node, children, ...props }: any) => animateText(React.createElement('h2', { className: 'font-semibold text-xl', ...props }, children)),
  h3: ({ animateText, node, children, ...props }: any) => animateText(React.createElement('h3', { className: 'font-semibold text-lg', ...props }, children)),
  h4: ({ animateText, node, children, ...props }: any) => animateText(React.createElement('h4', { className: 'font-semibold text-base', ...props }, children)),
  h5: ({ animateText, node, children, ...props }: any) => animateText(React.createElement('h5', { className: 'font-medium', ...props }, children)),
  strong: ({ animateText, node, children, ...props }: any) => animateText(React.createElement('strong', { className: 'font-semibold', ...props }, children)),
  a: ({ animateText, node, children, href, ...props }: any) => animateText(React.createElement('a', { href, className: 'text-primary underline underline-offset-2', target: '_blank', rel: 'noopener noreferrer', ...props }, children)),
  blockquote: ({ animateText, node, children, ...props }: any) => animateText(React.createElement('blockquote', { className: 'border-l-2 border-primary pl-4', ...props }, children)),
  ol: ({ animateText, node, children, ...props }: any) => animateText(React.createElement('ol', { className: 'list-decimal space-y-2 pl-6', ...props }, children)),
  ul: ({ animateText, node, children, ...props }: any) => animateText(React.createElement('ul', { className: 'list-disc space-y-2 pl-6', ...props }, children)),
  li: ({ animateText, node, children, ...props }: any) => animateText(React.createElement('li', { className: 'my-1.5', ...props }, children)),
  p: ({ animateText, node, children, ...props }: any) => animateText(React.createElement('p', { className: 'whitespace-pre-wrap', ...props }, children)),
  hr: ({ animateText, node, children, ...props }: any) => animateText(React.createElement('hr', { className: 'border-foreground/20', ...props }, children)),
};

function dataUrlToUint8Array(data: string) {
  const base64 = data.split(",")[1]
  const buf = Buffer.from(base64, "base64")
  return new Uint8Array(buf)
}

interface ModelBadgeProps {
  modelId?: string
  modelProvider?: 'openrouter' | 'google'
}

const ModelBadge: React.FC<ModelBadgeProps> = ({ modelId, modelProvider }) => {
  // Only render if we have valid provider and model information
  if (!modelProvider || !modelId) {
    return null;
  }
  
  return (
    <motion.div 
      className="flex items-center gap-1.5 text-xs mt-2 px-2 py-1 bg-muted/50 dark:bg-muted/30 border-2 border-border rounded-md w-fit opacity-75"
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 0.75, y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 500, 
        damping: 30,
        delay: 0.1
      }}
    >
      {modelProvider === 'google' ? (
        <Gemini className="h-3 w-3 text-purple-600" />
      ) : modelProvider === 'openrouter' ? (
        <OpenRouter className="h-3 w-3 text-[#6467f2]" />
      ) : null}
      <span className="text-muted-foreground font-medium text-[10px]">
        {modelId}
      </span>
    </motion.div>
  );
};

const ReasoningBlock = ({ part }: { part: ReasoningPart }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="mb-2 flex flex-col items-start max-w-[min(70%,theme(maxWidth.2xl))] w-fit">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="group w-full overflow-hidden rounded-lg border bg-muted/50"
      >
        <div className="flex items-center p-2">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
              <span>Thinking</span>
            </button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent forceMount>
          <motion.div
            initial={false}
            animate={isOpen ? "open" : "closed"}
            variants={{
              open: { height: "auto", opacity: 1 },
              closed: { height: 0, opacity: 0 },
            }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="border-t"
          >
            <div className="p-2">
              <div className="whitespace-pre-wrap text-xs">
                {part.reasoning}
              </div>
            </div>
          </motion.div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

function ToolCall({
  toolInvocations,
  mode,
  setMode,
  append,
}: Pick<ChatMessageProps, "toolInvocations"> & {
  mode?: 'agent' | 'chat'
  setMode?: (mode: 'agent' | 'chat') => void
  append?: (message: { role: "user"; content: string }) => void
}) {
  if (!toolInvocations?.length) return null

  return (
    <div className="flex flex-col items-start gap-2 max-w-[min(80%,theme(maxWidth.2xl))] w-fit">
      {toolInvocations.map((invocation, index) => {
        const isCancelled =
          invocation.state === "result" &&
          invocation.result.__cancelled === true

        if (isCancelled) {
          return (
            <div
              key={index}
              className="flex items-center gap-2 rounded-lg border bg-red-50 dark:bg-red-950/20 px-3 py-2 text-sm text-red-600 dark:text-red-400"
            >
              <Ban className="h-4 w-4" />
              <span>
                Cancelled{" "}
                <span className="font-mono font-semibold">
                  {invocation.toolName}
                </span>
              </span>
            </div>
          )
        }

        switch (invocation.state) {
          case "partial-call":
          case "call":
            return (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg border bg-blue-50 dark:bg-blue-950/20 px-3 py-2 text-sm text-blue-600 dark:text-blue-400"
              >
                <Terminal className="h-4 w-4" />
                <span>
                  Using{" "}
                  <span className="font-mono font-semibold">
                    {invocation.toolName}
                  </span>
                  ...
                </span>
                <Loader2 className="h-3 w-3 animate-spin" />
              </div>
            )
          case "result":
            return (
              <ToolResult 
                key={index} 
                toolName={invocation.toolName} 
                result={invocation.result}
                mode={mode}
                setMode={setMode}
              />
            )
          default:
            return null
        }
      })}
    </div>
  )
}

function ToolResult({ 
  toolName, 
  result, 
  mode, 
  setMode,
  append
}: { 
  toolName: string; 
  result: unknown;
  mode?: 'agent' | 'chat';
  setMode?: (mode: 'agent' | 'chat') => void;
  append?: (message: { role: "user"; content: string }) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Format different types of tool results
  const formatResult = (data: unknown) => {
    // Type guard function
    const isObject = (value: unknown): value is Record<string, unknown> => {
      return typeof value === 'object' && value !== null
    }
    
    if (!isObject(data)) return null

    switch (toolName) {
      case 'calculate':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Expression:</span>
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                {String(data.expression || '')}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Result:</span>
              <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                {String(data.result || '')}
              </span>
            </div>
          </div>
        )
      
      case 'createFile':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">File:</span>
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                {String(data.filename || '')}
              </code>
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              ✓ {String(data.message || 'File created successfully')}
            </div>
          </div>
        )
      
      case 'generateCode':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Language:</span>
              <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-sm">
                {String(data.language || '')}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {String(data.description || '')}
            </div>
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                View generated code
              </CollapsibleTrigger>
              <CollapsibleContent>
                <pre className="mt-2 overflow-x-auto bg-gray-900 text-gray-100 p-3 rounded text-xs">
                  <code>{String(data.code || '')}</code>
                </pre>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )
      
      case 'createTaskPlan':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Task:</span>
              <span className="text-sm">{String(data.task || '')}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">Complexity: {String(data.complexity || '')}</span>
              <span className="text-xs text-gray-500">Est. Time: {String(data.estimatedTime || '')}</span>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-medium">Steps:</span>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                {Array.isArray(data.steps) && data.steps.map((step, i) => (
                  <li key={i} className="text-gray-700 dark:text-gray-300">{String(step)}</li>
                ))}
              </ol>
            </div>
          </div>
        )
      
      case 'weather':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Location:</span>
              <span className="text-sm">{String(data.location || '')}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-lg font-semibold">{isObject(data.current) ? String(data.current.temperature) : ''}°F</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{isObject(data.current) ? String(data.current.condition) : ''}</span>
            </div>
            <div className="flex gap-4 text-xs text-gray-500">
              <span>Humidity: {isObject(data.current) ? String(data.current.humidity) : ''}%</span>
              <span>Wind: {isObject(data.current) ? String(data.current.windSpeed) : ''} mph</span>
            </div>
          </div>
        )
      
      default:
        return (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-foreground">
              <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              View raw result
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded">
                {JSON.stringify(data, null, 2)}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        )
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-green-50 dark:bg-green-950/20 px-3 py-2 text-sm">
      <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
        <Code2 className="h-4 w-4" />
        <span className="font-medium">
          {toolName}
        </span>
      </div>
      <div className="text-foreground">
        {formatResult(result)}
      </div>
    </div>
  )
}
