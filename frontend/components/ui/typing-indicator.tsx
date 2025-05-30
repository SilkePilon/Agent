"use client"

import { motion } from "framer-motion"
import { Bot } from "lucide-react"

interface TypingIndicatorProps {
  mode?: 'agent' | 'chat'
}

export function TypingIndicator({ mode = 'chat' }: TypingIndicatorProps) {
  // Color schemes based on mode
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
      <div className="flex items-start space-x-3">
      
        {/* Chat Bubble with Typing Animation */}
        <motion.div 
          className="group relative rounded-2xl bg-muted px-4 py-3 shadow-sm border"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 20,
            delay: 0.2 
          }}
        >
          {/* Thinking text */}
          <motion.div 
            className="flex items-center space-x-2 text-xs text-muted-foreground mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <span className="font-medium">
              {mode === 'agent' ? 'Agent is processing' : 'AI is thinking'}
            </span>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="h-3 w-3"
            >
              <div className={`h-full w-full border-2 ${colorScheme.spinnerBorder} rounded-full`} />
            </motion.div>
          </motion.div>

          {/* Animated dots with different patterns */}
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

          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent"
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
            className={`absolute -inset-0.5 rounded-2xl border ${colorScheme.borderColor}`}
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
