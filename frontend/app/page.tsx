"use client"

import { useSearchParams } from "next/navigation"
import { useChat } from "@/providers/ChatProvider"
import { ChatDemo } from "@/components/chat-demo"
import { useIsMobile } from "@/hooks/use-mobile"

export default function Dashboard() {
  const {
    messages,
    isLoading,
    isProductionMode,
    sendMessage,
    resetChat,
    generateEmailSummary,
    toggleMode
  } = useChat()
  const isMobile = useIsMobile()
  const searchParams = useSearchParams()
  const isIframe = searchParams.has('iframe')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const textarea = form.querySelector('textarea')
    if (textarea && textarea.value.trim()) {
      sendMessage(textarea.value)
      textarea.value = ''
    }
  }

  return (
    <div className={`${isIframe ? 'h-screen' : 'container mx-auto p-4'} min-h-screen bg-background overflow-x-hidden`}>
      <main className={`${isIframe ? 'h-full' : 'max-w-7xl mx-auto'} ${!isIframe && isMobile ? 'h-[calc(100vh-7rem)]' : !isIframe ? 'h-[calc(100vh-4rem)] mt-8' : ''} ${isIframe ? '' : 'rounded-3xl border shadow-lg'} flex flex-col`}>
        <ChatDemo />
      </main>
    </div>
  )
}
