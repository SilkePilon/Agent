"use client"

import { useState, FormEvent, ChangeEvent } from "react"
import { useChat } from "@/providers/ChatProvider"
import { cn } from "@/lib/utils"
import { Chat } from "@/components/ui/chat"
import { ModeToggle } from "@/components/mode-toggle"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const MODELS = [
    { id: "test", name: "Test Mode" },
    { id: "production", name: "Production Mode" },
]

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    projectIdea?: string;
}

export function ChatDemo() {
    const {
        messages: originalMessages,
        isLoading,
        isProductionMode,
        sendMessage,
        resetChat: resetChatOriginal,
        generateEmailSummary: generateEmailSummaryOriginal,
        toggleMode
    } = useChat()
    const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)    // Show alert for 3 seconds then fade out
    const showAlert = (type: 'success' | 'error' | 'info', message: string) => {
        setAlert({ type, message })
        setTimeout(() => setAlert(null), 3000)
    }    // Wrap original functions to show alerts
    const resetChatWrapper = async () => {
        try {
            await resetChatOriginal()
            showAlert('success', 'Chat has been reset')
        } catch (error: any) {
            showAlert('error', error?.message || 'Failed to reset chat')
        }
    }

    const generateEmailSummaryWrapper = async () => {
        try {
            showAlert('info', 'Generating email summary...')
            const result = await generateEmailSummaryOriginal()
            showAlert('success', 'Email summary generated successfully')
            return result
        } catch (error) {
            showAlert('error', 'Failed to generate email summary')
            throw error
        }
    }

    // Transform messages to include required id field and show suggestions if no messages
    const messages = originalMessages.length ? originalMessages.map((msg, index) => ({
        ...msg,
        id: `${msg.role}-${index}`
    })) : []

    const [input, setInput] = useState("")

    const handleInputChange = (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value)
    }

    const handleSubmit = (event?: { preventDefault?: () => void }, options?: { experimental_attachments?: FileList }) => {
        event?.preventDefault?.()
        if (!input.trim()) return

        sendMessage(input)
        setInput("")
    }

    const stop = () => {
        // Optional: Implement if your API supports stopping generation
    }

    const append = (message: { role: "user"; content: string }) => {
        if (message.role === "user") {
            sendMessage(message.content)
        }
    }

    return (
        <div className={cn("flex", "flex-col", "h-[500px]", "w-full", "relative")}>
            {alert && (<div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-50 w-96 animate-in fade-in slide-in-from-top-2">
                <Alert
                    variant={alert.type === 'error' ? 'destructive' : 'default'}
                    className={cn(
                        "mb-4 border-2",
                        alert.type === 'error'
                            ? 'border-destructive'
                            : alert.type === 'info'
                                ? 'border-blue-500 text-blue-500'
                                : 'border-emerald-500 text-emerald-500'
                    )}
                >
                    {alert.type === 'error' ? (
                        <AlertCircle className="h-4 w-4" />
                    ) : alert.type === 'info' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1-1a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}            <AlertDescription className={
                        alert.type === 'error' ? '' :
                            alert.type === 'info' ? 'text-blue-500' : 'text-emerald-500'
                    }>
                        {alert.message}
                    </AlertDescription>
                </Alert>
            </div>
            )}
            <div className={cn("flex", "justify-end", "mb-2", "gap-2")}>
                <Select value={isProductionMode ? "production" : "test"} onValueChange={(value) => toggleMode()}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Mode" />
                    </SelectTrigger>
                    <SelectContent>
                        {MODELS.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                                {model.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <ModeToggle />
            </div>
            <Chat
                className="grow"
                messages={messages}
                handleSubmit={handleSubmit}
                input={input}
                handleInputChange={handleInputChange}
                isGenerating={isLoading}
                stop={stop}
                append={append}
                setMessages={() => { }} // We handle message updates through our own state
                resetChat={resetChatWrapper}
                generateEmailSummary={generateEmailSummaryWrapper}
                suggestions={[
                    "Help me met het starten van mijn bedrijf",
                    "Waar heeft bluey allemaal ervaring mee?",
                ]}
            />
        </div>
    )
}
