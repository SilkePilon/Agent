import React, { Suspense } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ExternalLink } from "lucide-react"

import { cn } from "@/lib/utils"
import { CopyButton } from "@/components/ui/copy-button"
import { Badge } from "@/components/ui/badge"

interface MarkdownRendererProps {
  children: string
}

// Function to detect URLs in text
const detectLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.match(urlRegex) || []
}

// Component to render detected links with badges
const LinkBadges = ({ text }: { text: string }) => {
  const links = detectLinks(text)
  
  if (links.length === 0) return null
  
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {links.map((link, index) => (
        <Badge 
          key={index} 
          variant="outline" 
          className="inline-flex items-center gap-1 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20"
          onClick={() => window.open(link, '_blank')}
        >
          <ExternalLink className="h-3 w-3" />
          {new URL(link).hostname}
        </Badge>
      ))}
    </div>
  )
}

export function MarkdownRenderer({ children }: MarkdownRendererProps) {
  return (
    <div className="space-y-3 max-w-full overflow-x-hidden">
      <Markdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {children}
      </Markdown>
      <LinkBadges text={children} />
    </div>
  )
}

interface HighlightedPre extends React.HTMLAttributes<HTMLPreElement> {
  children: string
  language: string
}

const HighlightedPre = React.memo(
  async ({ children, language, ...props }: HighlightedPre) => {
    const { codeToTokens, bundledLanguages } = await import("shiki")

    if (!(language in bundledLanguages)) {
      return <pre {...props}>{children}</pre>
    }

    const { tokens } = await codeToTokens(children, {
      lang: language as keyof typeof bundledLanguages,
      defaultColor: false,
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
    })

    return (
      <pre {...props}>
        <code>
          {tokens.map((line, lineIndex) => (
            <>
              <span key={lineIndex}>
                {line.map((token, tokenIndex) => {
                  const style =
                    typeof token.htmlStyle === "string"
                      ? undefined
                      : token.htmlStyle

                  return (
                    <span
                      key={tokenIndex}
                      className="text-shiki-light bg-shiki-light-bg dark:text-shiki-dark dark:bg-shiki-dark-bg"
                      style={style}
                    >
                      {token.content}
                    </span>
                  )
                })}
              </span>
              {lineIndex !== tokens.length - 1 && "\n"}
            </>
          ))}
        </code>
      </pre>
    )
  }
)
HighlightedPre.displayName = "HighlightedCode"

interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  children: React.ReactNode
  className?: string
  language: string
}

const CodeBlock = ({
  children,
  className,
  language,
  ...restProps
}: CodeBlockProps) => {
  const code =
    typeof children === "string"
      ? children
      : childrenTakeAllStringContents(children)

  const preClass = cn(
    "overflow-x-auto rounded-md border bg-background/50 p-4 font-mono text-sm max-w-full [scrollbar-width:none]",
    className
  )

  return (
    <div className="group/code relative mb-4 max-w-full overflow-hidden">
      <Suspense
        fallback={
          <pre className={preClass} {...restProps}>
            {children}
          </pre>
        }
      >
        <HighlightedPre language={language} className={preClass}>
          {code}
        </HighlightedPre>
      </Suspense>

      <div className="invisible absolute right-2 top-2 flex space-x-1 rounded-lg p-1 opacity-0 transition-all duration-200 group-hover/code:visible group-hover/code:opacity-100">
        <CopyButton content={code} copyMessage="Copied code to clipboard" />
      </div>
    </div>
  )
}

function childrenTakeAllStringContents(element: any): string {
  if (typeof element === "string") {
    return element
  }

  if (element?.props?.children) {
    const children = element.props.children

    if (Array.isArray(children)) {
      return children
        .map((child) => childrenTakeAllStringContents(child))
        .join("")
    } else {
      return childrenTakeAllStringContents(children)
    }
  }

  return ""
}

const COMPONENTS = {
  h1: withClass("h1", "text-2xl font-semibold"),
  h2: withClass("h2", "font-semibold text-xl"),
  h3: withClass("h3", "font-semibold text-lg"),
  h4: withClass("h4", "font-semibold text-base"),
  h5: withClass("h5", "font-medium"),
  strong: withClass("strong", "font-semibold"),
  a: ({ href, children, ...props }: { href?: string; children?: React.ReactNode } & React.HTMLProps<HTMLAnchorElement>) => (
    <a 
      href={href} 
      className="text-primary underline underline-offset-2" 
      target="_blank" 
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
  blockquote: withClass("blockquote", "border-l-2 border-primary pl-4"),
  code: ({ children, className, ...rest }: { children?: React.ReactNode; className?: string } & React.HTMLProps<HTMLElement>) => {
    const match = /language-(\w+)/.exec(className || "")
    return match ? (
      <CodeBlock className={className} language={match[1]} {...rest}>
        {children}
      </CodeBlock>
    ) : (
      <code
        className={cn(
          "font-mono [:not(pre)>&]:rounded-md [:not(pre)>&]:bg-background/50 [:not(pre)>&]:px-1 [:not(pre)>&]:py-0.5"
        )}
        {...rest}
      >
        {children}
      </code>
    )
  },
  pre: ({ children }: { children?: React.ReactNode }) => children,
  ol: withClass("ol", "list-decimal space-y-2 pl-6"),
  ul: withClass("ul", "list-disc space-y-2 pl-6"),
  li: withClass("li", "my-1.5"),
  table: withClass(
    "table",
    "max-w-full border-collapse overflow-auto rounded-md border border-foreground/20"
  ),
  th: withClass(
    "th",
    "border border-foreground/20 px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right"
  ),
  td: withClass(
    "td",
    "border border-foreground/20 px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right"
  ),
  tr: withClass("tr", "m-0 border-t p-0 even:bg-muted"),
  p: withClass("p", "whitespace-pre-wrap"),
  hr: withClass("hr", "border-foreground/20"),
}

function withClass<T extends keyof React.JSX.IntrinsicElements>(tag: T, classes: string) {
  const Component = ({ ...props }: React.ComponentPropsWithoutRef<T>) => 
    React.createElement(tag as string, { className: classes, ...props })
  
  Component.displayName = String(tag)
  return Component
}

export default MarkdownRenderer
