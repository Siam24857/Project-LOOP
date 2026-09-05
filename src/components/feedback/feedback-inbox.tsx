"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { getSourceLabel, getSentimentColor, getStatusColor, getPriorityColor, truncate, formatDate } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Upload, Zap, ChevronLeft, ChevronRight } from "lucide-react"
import { ImportDialog } from "@/components/feedback/import-dialog"
import type { FeedbackWithThemes, PaginatedResponse } from "@/types"

interface FilterState {
  search: string
  source: string
  sentiment: string
  status: string
  category: string
  from: string
  to: string
  sortBy: string
}

function buildParams(options: FilterState): URLSearchParams {
  const params = new URLSearchParams({
    page: "1",
    pageSize: "20",
  })
  for (const [key, value] of Object.entries(options)) {
    if (value) params.set(key, value)
  }
  return params
}

export function FeedbackInbox({ initialSearch = "" }: { initialSearch?: string }) {
  const [feedbacks, setFeedbacks] = useState<FeedbackWithThemes[]>([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(initialSearch)
  const [sourceFilter, setSourceFilter] = useState("")
  const [sentimentFilter, setSentimentFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [sortBy, setSortBy] = useState("createdAt")
  const [simulating, setSimulating] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const filters: FilterState = {
    search,
    source: sourceFilter,
    sentiment: sentimentFilter,
    status: statusFilter,
    category: categoryFilter,
    from: fromDate,
    to: toDate,
    sortBy,
  }

  useEffect(() => {
    let cancelled = false

    async function run() {
      const params = buildParams(filters)
      try {
        const res = await fetch(`/api/feedback?${params}`)
        if (res.ok && !cancelled) {
          const data = (await res.json()) as PaginatedResponse<FeedbackWithThemes>
          setFeedbacks(data.data)
          setPagination(data.pagination)
        }
      } catch (err) {
        if (!cancelled) console.error("Failed to load feedback:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sourceFilter, sentimentFilter, statusFilter, categoryFilter, fromDate, toDate, sortBy])

  const fetchPage = useCallback(
    async (page: number) => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: "20",
          ...(search ? { search } : {}),
          ...(sourceFilter ? { source: sourceFilter } : {}),
          ...(sentimentFilter ? { sentiment: sentimentFilter } : {}),
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(categoryFilter ? { category: categoryFilter } : {}),
          ...(fromDate ? { from: fromDate } : {}),
          ...(toDate ? { to: toDate } : {}),
          ...(sortBy ? { sortBy } : {}),
        })

        const res = await fetch(`/api/feedback?${params}`)
        if (res.ok) {
          const data = (await res.json()) as PaginatedResponse<FeedbackWithThemes>
          setFeedbacks(data.data)
          setPagination(data.pagination)
        }
      } catch (err) {
        console.error("Failed to load feedback:", err)
      } finally {
        setLoading(false)
      }
    },
    [search, sourceFilter, sentimentFilter, statusFilter, categoryFilter, fromDate, toDate, sortBy]
  )

  const handleSimulate = async () => {
    setSimulating(true)
    try {
      const res = await fetch("/api/feedback/simulate", { method: "POST" })
      if (res.ok) {
        void fetchPage(pagination.page)
      }
    } catch (err) {
      console.error("Simulate failed:", err)
    } finally {
      setSimulating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Feedback</h1>
          <p className="text-sm text-gray-500">{pagination.total} feedback items</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </button>
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            <Zap className="h-4 w-4" />
            {simulating ? "Simulating..." : "Simulate Feedback"}
          </button>
          <Link
            href="/feedback/new"
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" />
            Add Feedback
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search feedback, customers, themes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border bg-gray-50 pl-10 pr-4 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="rounded-lg border bg-gray-50 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
            >
              <option value="">All Sources</option>
              <option value="SUPPORT">Support</option>
              <option value="APP_REVIEW">App Review</option>
              <option value="SURVEY">Survey</option>
              <option value="SALES">Sales</option>
              <option value="MANUAL">Manual</option>
              <option value="SIMULATED">Simulated</option>
            </select>
            <select
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value)}
              className="rounded-lg border bg-gray-50 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
            >
              <option value="">All Sentiment</option>
              <option value="POSITIVE">Positive</option>
              <option value="NEUTRAL">Neutral</option>
              <option value="NEGATIVE">Negative</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border bg-gray-50 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="NEW">New</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="RESOLVED">Resolved</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border bg-gray-50 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="performance">Performance</option>
              <option value="ux">UX</option>
              <option value="pricing">Pricing</option>
              <option value="support">Support</option>
              <option value="features">Features</option>
              <option value="bug">Bug</option>
              <option value="checkout">Checkout</option>
              <option value="mobile">Mobile</option>
              <option value="onboarding">Onboarding</option>
              <option value="billing">Billing</option>
              <option value="security">Security</option>
              <option value="other">Other</option>
            </select>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-lg border bg-gray-50 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-lg border bg-gray-50 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border bg-gray-50 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
            >
              <option value="createdAt">Newest first</option>
              <option value="updatedAt">Recently updated</option>
              <option value="priority">Priority</option>
              <option value="customerName">Customer name</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : feedbacks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No feedback found.</p>
            <Link href="/feedback/new" className="mt-2 inline-block text-sm font-medium text-violet-600 hover:text-violet-700">
              Add your first feedback
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((fb) => (
            <Link
              key={fb.id}
              href={`/feedback/${fb.id}`}
              className="block rounded-xl border bg-white p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {getSourceLabel(fb.source)}
                    </Badge>
                    <span className="text-xs text-gray-500">{fb.customerName}</span>
                    {fb.customerEmail && (
                      <span className="text-xs text-gray-400">· {fb.customerEmail}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-900">{truncate(fb.content, 200)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {fb.themes?.map((t) => (
                      <Badge key={t.theme.id} variant="secondary" className="text-xs">
                        {t.theme.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={`text-xs ${getSentimentColor(fb.sentiment)}`}>
                    {fb.sentiment}
                  </Badge>
                  <Badge className={`text-xs ${getStatusColor(fb.status)}`}>
                    {fb.status}
                  </Badge>
                  <Badge className={`text-xs ${getPriorityColor(fb.priority)}`}>
                    {fb.priority}
                  </Badge>
                  <span className="text-xs text-gray-400">{formatDate(fb.createdAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => void fetchPage(pagination.page - 1)}
            disabled={pagination.page <= 1 || loading}
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => void fetchPage(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || loading}
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}