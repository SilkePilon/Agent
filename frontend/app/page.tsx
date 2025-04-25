"use client"

import { Button } from "@/components/ui/button"
import { useChat } from "@/providers/ChatProvider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ChatDemo } from "@/components/chat-demo"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Book,
  Bot,
  Code2,
  CornerDownLeft,
  LifeBuoy,
  Settings2,
  Share,
  SquareTerminal,
  SquareUser,
  Triangle,
  Zap,
  Rocket,
  Atom,
} from "lucide-react"

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
    <div className="container mx-auto p-4 min-h-screen bg-background overflow-x-hidden">
      <main className="max-w-4xl mx-auto mt-8 rounded-3xl border shadow-lg">
        <div className="p-6">
          {/* <h1 className="text-2xl font-bold mb-6">Chat Assistant</h1> */}
          <ChatDemo />
        </div>
      </main>
    </div>
  )
}
