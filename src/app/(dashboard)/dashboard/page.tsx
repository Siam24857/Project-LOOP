"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { getGreeting, getSourceLabel, getSentimentColor, getStatusColor } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  TrendingDown,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Layers,
  Sparkles,
  Lightbulb,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts"
import Link from "next/link"

interface RecentFeedback {
  id: string
  content: string
  sentiment: string
  status: string
  source: string
  customerName: string
  themes: {
    theme: {
      id: string
      name: string
    }
  }[]
}

interface Stats {
  totalFeedback: number
  positivePercent: number
  negativePercent: number
  openIssues: number
  activeThemes: number
  recentFeedback: RecentFeedback[]
}

interface SentimentPoint {
  date: string
  positive: number
  neutral: number
  negative: number
}

interface SourceBreakdown {
  source: string
  count: number
}

interface ThemeStat {
  name: string
  feedbackCount: number
  positiveCount: number
  negativeCount: number
  trendScore: number
}

interface AnalyticsResponse {
  stats: Stats
  sentimentOverTime: SentimentPoint[]
  sourceBreakdown: SourceBreakdown[]
  topThemes: ThemeStat[]
  sentimentDistribution: { sentiment: string; count: number }[]
}

interface Insight {
  tone: "warning" | "positive" | "action"
  title: string
  description: string
}

function computeInsights(analytics: AnalyticsResponse, stats: Stats): Insight[] {
  const insights: Insight[] = []

  const themeVolume = analytics.topThemes.reduce((sum, t) => sum + t.feedbackCount, 0) || 1
  const driveThemes = analytics.topThemes.filter((t) => t.negativeCount > 0)
  const topNegativeTheme = [...driveThemes].sort(
    (a, b) => b.negativeCount / themeVolume - a.negativeCount / themeVolume
  )[0]

  const points = analytics.sentimentOverTime
  if (points.length >= 4) {
    const half = Math.floor(points.length / 2)
    const firstHalf = points.slice(0, half).reduce((sum, p) => sum + p.negative, 0)
    const secondHalf = points.slice(half).reduce((sum, p) => sum + p.negative, 0)
    if (firstHalf > 0) {
      const delta = Math.round(((secondHalf - firstHalf) / firstHalf) * 100)
      if (delta > 0) {
        insights.push({
          tone: "warning",
          title: "Trending Issue",
          description: `Negative feedback increased ${delta}% over the recent period, ${
            topNegativeTheme
              ? `mainly driven by "${topNegativeTheme.name}"`
              : "spread across multiple areas"
          }.`,
        })
      } else if (delta < 0) {
        insights.push({
          tone: "positive",
          title: "Improvement Signal",
          description: `Negative feedback decreased ${Math.abs(delta)}% over the recent period. Recent changes appear to be working.`,
        })
      }
    }
  }

  const positiveOverTime = points.reduce((sum, p) => sum + p.positive, 0)
  const negativeOverTime = points.reduce((sum, p) => sum + p.negative, 0)
  if (totalRatioPositive(positiveOverTime, negativeOverTime, stats)) {
    insights.push({
      tone: "positive",
      title: "Positive Signal",
      description: `Customer happiness is outweighing complaints ${positiveOverTime} to ${negativeOverTime} in the last 30 days. Consider doubling down on what's working.`,
    })
  }

  const topGainingTheme = [...analytics.topThemes].sort(
    (a, b) => b.trendScore - a.trendScore
  )[0]

  if (topNegativeTheme && topNegativeTheme.negativeCount > 0) {
    insights.push({
      tone: "action",
      title: "Recommended Action",
      description: `Prioritize "${topNegativeTheme.name}" — it generates the most negative feedback. Investigate recent mentions and open a focused improvement cycle.${topGainingTheme ? ` For balance, protect the strength of "${topGainingTheme.name}".` : ""}`,
    })
  } else if (topGainingTheme && topGainingTheme.feedbackCount > 0) {
    insights.push({
      tone: "action",
      title: "Growth Opportunity",
      description: `"${topGainingTheme.name}" has the strongest positive-to-negative ratio. Highlight it in marketing and expand related capabilities.`,
    })
  }

  const topSource = [...analytics.sourceBreakdown].sort((a, b) => b.count - a.count)[0]
  if (topSource && topSource.count > 0) {
    insights.push({
      tone: "positive",
      title: "Channel Insight",
      description: `"${getSourceLabel(topSource.source)}" is your most active channel with ${topSource.count} recent items. Monitor it closely for early warning signals.`,
    })
  }

  if (insights.length === 0) {
    insights.push({
      tone: "positive",
      title: "Getting Started",
      description: "As more feedback accumulates, LOOP will surface trends, risks, and recommended actions here.",
    })
  }

  return insights
}

function totalRatioPositive(
  positiveSum: number,
  negativeSum: number,
  stats: Stats
): boolean {
  if (positiveSum === 0) return false
  return positiveSum >= negativeSum && stats.totalFeedback > 0
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/analytics?days=30")
        if (res.ok && !cancelled) {
          const data = (await res.json()) as AnalyticsResponse
          setAnalytics(data)
        }
      } catch (err) {
        if (!cancelled) console.error("Failed to load analytics:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchAnalytics()

    return () => {
      cancelled = true
    }
  }, [])

  const userName = session?.user?.name?.split(" ")[0] || "User"
  const workspaceName = session?.user?.workspaceName || "Workspace"

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-xl bg-gray-200" />
          <div className="h-80 animate-pulse rounded-xl bg-gray-200" />
        </div>
      </div>
    )
  }

  const stats = analytics?.stats
  const sentimentData = analytics?.sentimentOverTime || []
  const sourceData = (analytics?.sourceBreakdown || []).map((s) => ({
    name: getSourceLabel(s.source),
    count: s.count,
  }))
  const topThemes = analytics?.topThemes || []
  const recentFeedback = stats?.recentFeedback || []
  const insights = analytics && stats ? computeInsights(analytics, stats) : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{getGreeting()}, {userName}</h1>
        <p className="text-sm text-gray-500">{workspaceName} overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Feedback</p>
                <p className="text-2xl font-bold">{stats?.totalFeedback?.toLocaleString() || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-violet-100" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Positive</p>
                <p className="text-2xl font-bold text-emerald-600">{stats?.positivePercent || 0}%</p>
              </div>
              <ThumbsUp className="h-8 w-8 text-emerald-100" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Negative</p>
                <p className="text-2xl font-bold text-red-600">{stats?.negativePercent || 0}%</p>
              </div>
              <ThumbsDown className="h-8 w-8 text-red-100" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Open Issues</p>
                <p className="text-2xl font-bold text-amber-600">{stats?.openIssues || 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-amber-100" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Active Themes</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.activeThemes || 0}</p>
              </div>
              <Layers className="h-8 w-8 text-blue-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sentimentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="positive" stroke="#10b981" strokeWidth={2} name="Positive" />
                <Line type="monotone" dataKey="neutral" stroke="#f59e0b" strokeWidth={2} name="Neutral" />
                <Line type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={2} name="Negative" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feedback by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sourceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Top Themes */}
        <Card>
          <CardHeader>
            <CardTitle>Top Themes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topThemes.map((theme) => (
                <div key={theme.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{theme.name}</span>
                    <span className="text-gray-500">{theme.feedbackCount}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-violet-500"
                      style={{
                        width: `${Math.min(100, (theme.feedbackCount / (topThemes[0]?.feedbackCount || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
              {topThemes.length === 0 && (
                <p className="text-sm text-gray-500">No themes detected yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-500" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className={`rounded-lg border p-4 ${
                    insight.tone === "warning"
                      ? "border-amber-200 bg-amber-50"
                      : insight.tone === "positive"
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-violet-200 bg-violet-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {insight.tone === "warning" ? (
                      <TrendingUp className="mt-0.5 h-5 w-5 text-amber-600" />
                    ) : insight.tone === "positive" ? (
                      <TrendingDown className="mt-0.5 h-5 w-5 text-emerald-600" />
                    ) : (
                      <Lightbulb className="mt-0.5 h-5 w-5 text-violet-600" />
                    )}
                    <div>
                      <p className={`text-sm font-medium ${insight.tone === "warning" ? "text-amber-800" : insight.tone === "positive" ? "text-emerald-800" : "text-violet-800"}`}>
                        {insight.title}
                      </p>
                      <p className={`mt-1 text-sm ${insight.tone === "warning" ? "text-amber-700" : insight.tone === "positive" ? "text-emerald-700" : "text-violet-700"}`}>
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Feedback</span>
            <Link href="/feedback" className="text-sm font-normal text-violet-600 hover:text-violet-700">
              View all →
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentFeedback.map((fb) => (
              <Link
                key={fb.id}
                href={`/feedback/${fb.id}`}
                className="flex items-center gap-4 rounded-lg border p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{fb.content}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <span>{fb.customerName}</span>
                    <span>·</span>
                    <span>{getSourceLabel(fb.source)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {fb.themes?.map((t) => (
                    <Badge key={t.theme.id} variant="secondary" className="text-xs">
                      {t.theme.name}
                    </Badge>
                  ))}
                  <Badge className={`text-xs ${getSentimentColor(fb.sentiment)}`}>
                    {fb.sentiment}
                  </Badge>
                  <Badge className={`text-xs ${getStatusColor(fb.status)}`}>
                    {fb.status}
                  </Badge>
                </div>
              </Link>
            ))}
            {recentFeedback.length === 0 && (
              <div className="py-8 text-center text-sm text-gray-500">
                No feedback yet.{" "}
                <Link href="/feedback/new" className="text-violet-600 hover:text-violet-700">
                  Add your first feedback
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}