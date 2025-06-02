"use client"

import { motion } from "framer-motion"
import { Bot } from "lucide-react"
import { Gemini, OpenRouter } from '@lobehub/icons'

interface TypingIndicatorProps {
  mode?: 'agent' | 'chat'
  modelId?: string
  modelProvider?: 'openrouter' | 'google'
}

export function TypingIndicator({ mode = 'chat', modelId, modelProvider }: TypingIndicatorProps) {  // Color schemes based on mode
  const colorScheme = mode === 'agent' 
    ? {
        avatarBg: 'bg-blue-500',
        avatarText: 'text-white',
        dotGradient: 'from-blue-500/60 to-blue-600/80',
        borderColor: 'border-blue-500/15',
        spinnerBorder: 'border-muted-foreground/30 border-t-blue-500'
      }
    : {
        avatarBg: 'bg-primary',
        avatarText: 'text-primary-foreground',
        dotGradient: 'from-primary/60 to-primary/80',
        borderColor: 'border-primary/15',
        spinnerBorder: 'border-muted-foreground/30 border-t-primary'
      }
  return (
    <motion.div 
      className="flex justify-start"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ 
        type: "spring", 
        stiffness: 200, 
        damping: 20 
      }}
    >
      <div className="flex items-start space-x-3">        {/* Chat Bubble with Typing Animation */}
        <motion.div 
          className="group/message relative break-words rounded-lg p-3 text-sm w-fit bg-muted text-foreground"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 20,
            delay: 0.2 
          }}
        >          {/* Thinking text with animated dots on same line */}
          <motion.div 
            className="flex items-center space-x-3 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <span className="font-medium">
              {mode === 'agent' ? 'Agent is processing' : 'AI is thinking'}
            </span>
            
            {/* Animated dots */}
            <div className="flex space-x-1.5">
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${colorScheme.dotGradient}`}
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.4, 1, 0.4],
                    y: [0, -2, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: index * 0.15,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </motion.div>          {/* Model Badge */}
          {modelProvider && modelId && (
            <motion.div 
              className="flex items-center gap-1.5 text-xs mt-2 px-2 py-1 bg-muted/50 dark:bg-muted/30 border-2 border-border rounded-md w-fit opacity-75"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 0.75, y: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 500, 
                damping: 30,
                delay: 0.6
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
          )}
          
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{
              x: [-100, 100],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />
          
          {/* Subtle pulse ring effect */}
          <motion.div
            className={`absolute -inset-0.5 rounded-lg border ${colorScheme.borderColor}`}
            animate={{
              opacity: [0, 0.6, 0],
              scale: [0.98, 1.02, 0.98],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}
