"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface EmailRendererProps {
  emailHtml: string
  className?: string
}

export function EmailRenderer({ emailHtml, className }: EmailRendererProps) {  // Extract the email body while preserving line breaks and enhancing formatting
  const processedHtml = emailHtml
    .replace(/<html>|<\/html>|<body>|<\/body>/gi, '')
    // Improve paragraph formatting with spacing and line height
    .replace(/<p>/gi, '<div style="margin-bottom: 16px; line-height: 1.6;">')
    .replace(/<\/p>/gi, '</div>')
    // Add proper styling for signature line
    .replace(/<br>/gi, '<br style="margin-bottom: 8px">')
    // Replace placeholder with "User"
    .replace(/\$input\.first\(\)\.json\.query\.chatSession/g, '<span style="font-weight: 500;">User</span>')
    // Enhance greeting and closing
    .replace(/(Geachte\s+\w+),/gi, '<div style="font-weight: 500; font-size: 15px; margin-bottom: 16px;">$1,</div>')
    .replace(/(Met vriendelijke groet,)/gi, '<div style="margin-top: 16px; margin-bottom: 8px;">$1</div>')
    // Format list items if present
    .replace(/•\s+([^<]+)/g, '<div style="display: flex; margin-bottom: 10px;"><span style="margin-right: 8px;">•</span><span>$1</span></div>')
  return (    <div 
      className={cn(
        "email-container border-2 border-blue-200 rounded-lg p-5 bg-blue-50/80 dark:bg-slate-800/60 dark:border-slate-700 w-full max-w-full shadow-sm hover:shadow-md transition-shadow duration-200",
        className
      )}
    >
      <div 
        className="email-header border-b-2 border-blue-200 dark:border-slate-700 pb-3 mb-4 flex items-center"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6 mr-2 text-blue-500" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="font-medium text-blue-700 dark:text-blue-400">Email Samenvatting</span>
      </div>
      <div 
        className="email-body font-sans text-sm space-y-2 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />
    </div>
  )
}
