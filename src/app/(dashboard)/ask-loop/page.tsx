"use client"

import { useState } from "react"
import { getSourceLabel, getSentimentColor } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Send, Bot, User } from "lucide-react"

interface SupportingFeedback {
  id: string
  content: string
  sentiment: string
  source: string
  customerName: string
  createdAt: Date
}

interface Message {
  role: "user" | "assistant"
  content: string
  supportingFeedback?: SupportingFeedback[]
}

const exampleQuestions = [
  "What are customers complaining about most?",
  "Why are negative reviews increasing?",
  "What do customers like about our product?",
  "What are the biggest problems with checkout?",
  "Which themes are becoming more common?",
  "What should our product team fix first?",
]

export default function AskLoopPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const handleAsk = async (question?: string) => {
    const q = (question || input).trim()
    if (!q || loading) return

    setMessages((prev) => [...prev, { role: "user", content: q }])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      })

      if (res.ok) {
        const data = (await res.json()) as { answer: string; supportingFeedback: SupportingFeedback[] }
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.answer,
            supportingFeedback: data.supportingFeedback,
          },
        ])
      } else {
        const err = await res.json()
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: err.error || "Something went wrong. Please try again." },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-violet-500" />
          Ask LOOP
        </h1>
        <p className="text-sm text-gray-500">Ask questions about your customer feedback</p>
      </div>

      {/* Example questions */}
      <div className="flex flex-wrap gap-2">
        {exampleQuestions.map((q) => (
          <button
            key={q}
            onClick={() => handleAsk(q)}
            disabled={loading}
            className="rounded-full border bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4 min-h-[400px] max-h-[600px] overflow-y-auto">
            {messages.length === 0 && (
              <div className="py-16 text-center">
                <Bot className="mx-auto mb-4 h-12 w-12 text-violet-200" />
                <p className="text-gray-500">Ask a question about your customer feedback</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className="flex gap-3">
                {msg.role === "assistant" ? (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100">
                    <Sparkles className="h-4 w-4 text-violet-600" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                )}
                <div className="flex-1">
                  {msg.role === "assistant" ? (
                    <div className="rounded-lg rounded-tl-none bg-violet-50 p-4">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</p>
                      {msg.supportingFeedback && msg.supportingFeedback.length > 0 && (
                        <div className="mt-4 border-t border-violet-200 pt-3">
                          <p className="text-xs font-medium text-violet-700 mb-2">Supporting Feedback</p>
                          <div className="space-y-2">
                            {msg.supportingFeedback.map((fb) => (
                              <div key={fb.id} className="rounded-lg bg-white p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-[10px]">{getSourceLabel(fb.source)}</Badge>
                                  <Badge className={`text-[10px] ${getSentimentColor(fb.sentiment)}`}>{fb.sentiment}</Badge>
                                  <span className="text-[10px] text-gray-400">{fb.customerName}</span>
                                </div>
                                <p className="text-xs text-gray-700">{fb.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg rounded-tr-none bg-gray-100 p-4">
                      <p className="text-sm text-gray-800">{msg.content}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100">
                  <Sparkles className="h-4 w-4 animate-pulse text-violet-600" />
                </div>
                <div className="flex gap-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="mt-4 flex items-center gap-3 border-t pt-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder="Ask about your customer feedback..."
              className="flex-1 rounded-lg border px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              disabled={loading}
            />
            <button
              onClick={() => handleAsk()}
              disabled={loading || !input.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
