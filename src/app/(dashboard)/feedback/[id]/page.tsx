"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getSourceLabel, getSentimentColor, getPriorityColor, formatDateTime } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Trash2, Sparkles } from "lucide-react"

interface FeedbackThemeLink {
  theme: {
    id: string
    name: string
    description: string
  }
}

interface FeedbackDetail {
  id: string
  content: string
  source: string
  sentiment: string
  status: string
  priority: string
  category: string | null
  customerName: string
  customerEmail: string
  createdAt: string
  updatedAt: string
  themes: FeedbackThemeLink[]
}

export default function FeedbackDetailPage() {
  const params = useParams()
  const router = useRouter()
  const feedbackId = typeof params.id === "string" ? params.id : ""
  const [feedback, setFeedback] = useState<FeedbackDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [classifying, setClassifying] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`/api/feedback/${feedbackId}`)
        if (res.ok && !cancelled) {
          setFeedback((await res.json()) as FeedbackDetail)
        }
      } catch (err) {
        if (!cancelled) console.error(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [feedbackId])

  const handleClassify = async () => {
    if (!feedback) return
    setClassifying(true)
    try {
      const res = await fetch("/api/ai/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId: feedback.id }),
      })
      if (res.ok) {
        await res.json()
        const refetch = await fetch(`/api/feedback/${feedback.id}`)
        if (refetch.ok) {
          setFeedback((await refetch.json()) as FeedbackDetail)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setClassifying(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!feedback) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/feedback/${feedback.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setFeedback({ ...feedback, status: newStatus })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setUpdating(false)
    }
  }

  const handlePriorityChange = async (newPriority: string) => {
    if (!feedback) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/feedback/${feedback.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      })
      if (res.ok) {
        setFeedback({ ...feedback, priority: newPriority })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!feedback) return
    if (!confirm("Are you sure you want to delete this feedback?")) return
    try {
      const res = await fetch(`/api/feedback/${feedback.id}`, { method: "DELETE" })
      if (res.ok) {
        router.push("/feedback")
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-96 animate-pulse rounded-xl bg-gray-200" />
      </div>
    )
  }

  if (!feedback) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Feedback not found.</p>
        <Link href="/feedback" className="text-sm text-violet-600 hover:text-violet-700">← Back to feedback</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/feedback" className="rounded-lg p-1 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Feedback Detail</h1>
            <p className="text-sm text-gray-500">From {feedback.customerName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClassify}
            disabled={classifying}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {classifying ? "Analyzing..." : "AI Classify"}
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Content */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Feedback</h3>
              <p className="text-gray-900 whitespace-pre-wrap">{feedback.content}</p>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-gray-500">Source</p>
                <Badge variant="outline">{getSourceLabel(feedback.source)}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500">Customer</p>
                <p className="text-sm font-medium">{feedback.customerName}</p>
                {feedback.customerEmail && (
                  <p className="text-xs text-gray-500">{feedback.customerEmail}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Sentiment</p>
                <Badge className={getSentimentColor(feedback.sentiment)}>{feedback.sentiment}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Priority</p>
                <Badge className={getPriorityColor(feedback.priority)}>{feedback.priority}</Badge>
              </div>
            </div>

            {/* Status */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Status</p>
              <div className="flex items-center gap-2">
                {["NEW", "REVIEWED", "RESOLVED"].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={updating}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      feedback.status === s
                        ? "bg-violet-100 text-violet-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Priority</p>
              <div className="flex items-center gap-2">
                {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePriorityChange(p)}
                    disabled={updating}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      feedback.priority === p
                        ? "bg-violet-100 text-violet-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Themes */}
            {feedback.themes && feedback.themes.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Themes</p>
                <div className="flex flex-wrap gap-2">
                  {feedback.themes.map((t) => (
                    <Badge key={t.theme.id} variant="secondary">{t.theme.name}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Category */}
            {feedback.category && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Category</p>
                <Badge variant="outline">{feedback.category}</Badge>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-sm">{formatDateTime(feedback.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Updated</p>
                <p className="text-sm">{formatDateTime(feedback.updatedAt)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
