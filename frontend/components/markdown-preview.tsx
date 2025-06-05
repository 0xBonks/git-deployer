"use client"

import { FileText, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

interface MarkdownPreviewProps {
  content: string
  filename: string
}

export function MarkdownPreview({ content, filename }: MarkdownPreviewProps) {
  const [copied, setCopied] = useState(false)
  const [formattedContent, setFormattedContent] = useState<React.ReactNode[]>([])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  // Process markdown content when it changes
  useEffect(() => {
    setFormattedContent(formatContent(content))
  }, [content])

  // Improved markdown to HTML conversion for preview
  const formatContent = (markdown: string) => {
    const lines = markdown.split("\n")
    const formattedLines: React.ReactNode[] = []
    let inCodeBlock = false
    let codeBlockContent: string[] = []
    let codeLanguage = ""
    let inList = false
    let listItems: React.ReactNode[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Handle code blocks
      if (line.startsWith("```")) {
        if (inCodeBlock) {
          // End of code block
          inCodeBlock = false
          formattedLines.push(
            <div key={`code-block-${i}`} className="mb-4 mt-2 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden">
              {codeLanguage && (
                <div className="px-4 py-1 bg-slate-200 dark:bg-slate-700 text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {codeLanguage}
                </div>
              )}
              <pre className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300 font-mono overflow-auto">
                {codeBlockContent.join("\n")}
              </pre>
            </div>
          )
          codeBlockContent = []
          codeLanguage = ""
          continue
        } else {
          // Start of code block
          inCodeBlock = true
          codeLanguage = line.substring(3).trim()
          continue
        }
      }

      if (inCodeBlock) {
        codeBlockContent.push(line)
        continue
      }

      // Handle list items
      if (line.startsWith("- ") || line.startsWith("* ") || /^\d+\.\s/.test(line)) {
        if (!inList) {
          inList = true
          listItems = []
        }
        
        const isNumbered = /^\d+\.\s/.test(line)
        const content = line.replace(/^(\d+\.\s|\-\s|\*\s)/, "")
        
        listItems.push(
          <li 
            key={`list-${i}`} 
            className={`ml-5 mb-1 text-xs text-slate-700 dark:text-slate-300 ${isNumbered ? "list-decimal" : "list-disc"}`}
          >
            {processInlineFormatting(content)}
          </li>
        )
        continue
      } else if (inList) {
        // End of list
        formattedLines.push(
          <ul key={`list-container-${i}`} className="mb-4 pl-1">
            {listItems}
          </ul>
        )
        inList = false
        listItems = []
      }

      // Headers
      if (line.startsWith("# ")) {
        formattedLines.push(
          <h1 key={`header-${i}`} className="text-xl font-bold mt-6 mb-4 text-slate-900 dark:text-white">
            {processInlineFormatting(line.substring(2))}
          </h1>
        )
        continue
      }
      
      if (line.startsWith("## ")) {
        formattedLines.push(
          <h2 key={`header-${i}`} className="text-lg font-semibold mt-5 mb-3 text-slate-900 dark:text-white">
            {processInlineFormatting(line.substring(3))}
          </h2>
        )
        continue
      }
      
      if (line.startsWith("### ")) {
        formattedLines.push(
          <h3 key={`header-${i}`} className="text-base font-semibold mt-4 mb-2 text-slate-900 dark:text-white">
            {processInlineFormatting(line.substring(4))}
          </h3>
        )
        continue
      }
      
      if (line.startsWith("#### ")) {
        formattedLines.push(
          <h4 key={`header-${i}`} className="text-sm font-semibold mt-3 mb-2 text-slate-900 dark:text-white">
            {processInlineFormatting(line.substring(5))}
          </h4>
        )
        continue
      }

      // Horizontal rule
      if (line.trim() === "---") {
        formattedLines.push(<hr key={`hr-${i}`} className="my-4 border-slate-200 dark:border-slate-700" />)
        continue
      }

      // Empty lines
      if (line.trim() === "") {
        formattedLines.push(<div key={`empty-${i}`} className="h-2" />)
        continue
      }

      // Regular paragraphs
      formattedLines.push(
        <p key={`p-${i}`} className="mb-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          {processInlineFormatting(line)}
        </p>
      )
    }

    // If we ended while still in a list
    if (inList && listItems.length > 0) {
      formattedLines.push(
        <ul key="list-container-final" className="mb-4 pl-1">
          {listItems}
        </ul>
      )
    }

    return formattedLines
  }

  // Process inline formatting like bold, italic, code, links
  const processInlineFormatting = (text: string) => {
    // Process everything together for better handling of mixed formatting
    const segments: React.ReactNode[] = []
    let currentText = ""
    let currentIndex = 0
    
    // Helper to add current text to segments
    const addCurrentText = () => {
      if (currentText) {
        segments.push(<span key={`text-${currentIndex++}`}>{currentText}</span>)
        currentText = ""
      }
    }

    // First handle inline code with backticks
    const parts = text.split("`")
    if (parts.length > 1) {
      parts.forEach((part, index) => {
        if (index % 2 === 0) {
          // Regular text - may contain other formatting
          currentText += part
        } else {
          // Code - add current text first, then add code
          addCurrentText()
          segments.push(
            <code
              key={`code-${currentIndex++}`}
              className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs font-mono text-slate-800 dark:text-slate-200"
            >
              {part}
            </code>
          )
        }
      })
      addCurrentText()
      
      return segments
    }
    
    // If no code, process other formatting
    let tempText = text
    
    // Process links [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    let linkMatch
    let lastIndex = 0
    
    while ((linkMatch = linkRegex.exec(tempText)) !== null) {
      // Add text before the link
      if (linkMatch.index > lastIndex) {
        currentText += tempText.substring(lastIndex, linkMatch.index)
        addCurrentText()
      }
      
      // Add the link
      segments.push(
        <a
          key={`link-${currentIndex++}`}
          href={linkMatch[2]}
          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          target="_blank"
          rel="noopener noreferrer"
        >
          {linkMatch[1]}
        </a>
      )
      
      lastIndex = linkMatch.index + linkMatch[0].length
    }
    
    // Add any remaining text
    if (lastIndex < tempText.length) {
      currentText += tempText.substring(lastIndex)
    }
    
    // Process bold text with **
    if (currentText.includes("**")) {
      const boldParts = currentText.split("**")
      currentText = ""
      
      boldParts.forEach((part, index) => {
        if (index % 2 === 0) {
          currentText += part
        } else {
          addCurrentText()
          segments.push(
            <strong key={`bold-${currentIndex++}`} className="font-semibold text-slate-900 dark:text-white">
              {part}
            </strong>
          )
        }
      })
    }
    
    addCurrentText()
    return segments.length > 0 ? segments : text
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          <span className="text-sm font-medium text-slate-900 dark:text-white">{filename}</span>
        </div>
        <Button variant="outline" size="sm" onClick={copyToClipboard} className="h-8">
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 max-h-[70vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
        <div className="space-y-1">{formattedContent}</div>
      </div>
    </div>
  )
}
