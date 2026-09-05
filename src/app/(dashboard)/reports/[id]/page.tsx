"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { formatDateTime } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, FileDown, Download, Printer } from "lucide-react"

interface ReportDetail {
  id: string
  title: string
  summary: string
  content: string
  createdAt: string
}

export default function ReportDetailPage() {
  const params = useParams()
  const reportId = typeof params.id === "string" ? params.id : ""
  const [report, setReport] = useState<ReportDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`/api/reports/${reportId}`)
        if (res.ok && !cancelled) {
          setReport((await res.json()) as ReportDetail)
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
  }, [reportId])

  const renderContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      if (line.startsWith("# ")) {
        return <h1 key={i} className="text-2xl font-bold mt-6 mb-3">{line.slice(2)}</h1>
      }
      if (line.startsWith("## ")) {
        return <h2 key={i} className="text-xl font-bold mt-5 mb-2">{line.slice(3)}</h2>
      }
      if (line.startsWith("### ")) {
        return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.slice(4)}</h3>
      }
      if (line.startsWith("- ")) {
        return (
          <ul key={i} className="ml-4 mt-1 list-disc">
            <li className="text-sm text-gray-700">{line.slice(2)}</li>
          </ul>
        )
      }
      if (line.startsWith("1. ")) {
        return (
          <ol key={i} className="ml-4 mt-1 list-decimal">
            <li className="text-sm text-gray-700">{line.slice(3)}</li>
          </ol>
        )
      }
      if (!line.trim()) return <div key={i} className="h-3" />
      return <p key={i} className="text-gray-700 mb-2">{line}</p>
    })
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
        <div className="h-96 animate-pulse rounded-xl bg-gray-200" />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Report not found.</p>
        <Link href="/reports" className="text-sm text-violet-600 hover:text-violet-700">← Back to reports</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <Link href="/reports" className="rounded-lg p-1 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{report.title}</h1>
            <p className="text-sm text-gray-500">Generated {formatDateTime(report.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/reports/${report.id}/export?format=csv`}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            <FileDown className="h-4 w-4" />
            Data CSV
          </a>
          <a
            href={`/api/reports/${report.id}/export?format=markdown`}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Markdown
          </a>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            <Printer className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      <div className="print-report">
        <Card>
          <CardContent className="pt-6">
            <div className="mb-6 flex items-start gap-3 rounded-lg bg-violet-50 p-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-violet-800">Executive Summary</p>
                <p className="text-sm text-violet-700 mt-1">{report.summary}</p>
              </div>
            </div>

            <div className="max-w-none">{renderContent(report.content || "")}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}