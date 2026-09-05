"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Sparkles, ArrowRight, Trash2 } from "lucide-react"

interface ReportListItem {
  id: string
  title: string
  summary: string
  createdAt: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadReports() {
      try {
        const res = await fetch("/api/reports")
        if (res.ok && !cancelled) {
          setReports((await res.json()) as ReportListItem[])
        }
      } catch (err) {
        if (!cancelled) console.error(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadReports()

    return () => {
      cancelled = true
    }
  }, [])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch("/api/ai/report", { method: "POST" })
      if (res.ok) {
        const report = (await res.json()) as ReportListItem
        setReports((prev) => [report, ...prev])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this report?")) return
    try {
      const res = await fetch(`/api/reports/${id}`, { method: "DELETE" })
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== id))
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-32 animate-pulse rounded-xl bg-gray-200" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-gray-500">Voice-of-Customer reports</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {generating ? "Generating..." : "Generate VoC Report"}
        </button>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-violet-200" />
            <p className="text-gray-500 mb-2">No reports generated yet.</p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="text-sm font-medium text-violet-600 hover:text-violet-700"
            >
              Generate your first VoC report
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <Link href={`/reports/${report.id}`} className="flex items-center gap-3 group">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100">
                        <FileText className="h-5 w-5 text-violet-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium group-hover:text-violet-600 truncate">{report.title}</p>
                        <p className="text-sm text-gray-500 truncate">{report.summary}</p>
                      </div>
                    </Link>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400">{formatDate(report.createdAt)}</span>
                    <Link href={`/reports/${report.id}`} className="rounded-lg p-2 text-violet-600 hover:bg-violet-50">
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <button onClick={() => handleDelete(report.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}