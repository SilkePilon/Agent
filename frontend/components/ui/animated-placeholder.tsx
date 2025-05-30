"use client"

import { useState, useEffect } from "react"

interface AnimatedPlaceholderProps {
  suggestions: string[]
  typingSpeed?: number
  deletingSpeed?: number
  pauseDuration?: number
  className?: string
}

export function AnimatedPlaceholder({
  suggestions,
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseDuration = 2000,
  className = ""
}: AnimatedPlaceholderProps) {
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0)
  const [currentText, setCurrentText] = useState("")
  const [isTyping, setIsTyping] = useState(true)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (suggestions.length === 0) return

    const currentSuggestion = suggestions[currentSuggestionIndex]
    
    let timeout: NodeJS.Timeout

    if (isPaused) {
      // Pause before starting to delete
      timeout = setTimeout(() => {
        setIsPaused(false)
        setIsTyping(false)
      }, pauseDuration)
    } else if (isTyping) {
      // Typing animation
      if (currentText.length < currentSuggestion.length) {
        timeout = setTimeout(() => {
          setCurrentText(currentSuggestion.slice(0, currentText.length + 1))
        }, typingSpeed)
      } else {
        // Finished typing, start pause
        setIsPaused(true)
      }
    } else {
      // Deleting animation
      if (currentText.length > 0) {
        timeout = setTimeout(() => {
          setCurrentText(currentText.slice(0, -1))
        }, deletingSpeed)
      } else {
        // Finished deleting, move to next suggestion
        setCurrentSuggestionIndex((prev) => (prev + 1) % suggestions.length)
        setIsTyping(true)
      }
    }

    return () => clearTimeout(timeout)
  }, [currentText, currentSuggestionIndex, isTyping, isPaused, suggestions, typingSpeed, deletingSpeed, pauseDuration])

  return (
    <span className={className}>
      {currentText}
      <span className="animate-pulse">|</span>
    </span>
  )
}
