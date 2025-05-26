"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MessageSquare, Brain, Zap } from "lucide-react"; // Optional: Icons

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 py-12 px-4 text-center">
      {/* Hero Section */}
      <div className="mb-12">
        <MessageSquare className="h-24 w-24 text-blue-600 dark:text-blue-500 mx-auto mb-6" />
        <h1 className="text-5xl md:text-6xl font-bold text-gray-800 dark:text-white mb-6">
          Welcome to Your AI Assistant
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
          Experience the next generation of AI-powered chat. Engage in intelligent conversations, get assistance with complex tasks, and explore the future of AI.
        </p>
        <Link href="/chat" passHref>
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 transition-transform duration-150 ease-in-out hover:scale-105 text-lg px-8 py-6 rounded-lg shadow-lg hover:shadow-xl"
          >
            Open Chat Interface
          </Button>
        </Link>
      </div>

      {/* Feature Highlights Section - Optional but good for a landing page */}
      <div className="w-full max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Features</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
            <Brain className="h-12 w-12 text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-white mb-2">Advanced AI Models</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Access powerful AI models like Google Gemini and various OpenRouter options for diverse tasks.
            </p>
          </div>
          <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
            <Zap className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-white mb-2">Dual Conversation Modes</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Switch between focused Chat Mode and versatile Agent Mode with tool usage capabilities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
