"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'; // To use CodeBlock

interface CodeDisplayCardProps {
  code: string;
  language: string;
  title?: string;
  onClose: () => void; // Function to call when the close button is clicked
}

export function CodeDisplayCard({ code, language, title, onClose }: CodeDisplayCardProps) {
  // Prepare the markdown string for the CodeBlock
  const markdownCode = "```" + language + "\n" + code + "\n```";

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
        <CardTitle className="text-lg font-semibold">
          {title || language || "Generated Code"}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close code panel">
          <X className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-grow overflow-auto">
        {/* 
          MarkdownRenderer's CodeBlock expects to be a child of Markdown.
          We pass the complete markdown code block string to MarkdownRenderer.
          It will find the ```language ... ``` block and render it using CodeBlock.
        */}
        <MarkdownRenderer>{markdownCode}</MarkdownRenderer>
      </CardContent>
    </Card>
  );
}
