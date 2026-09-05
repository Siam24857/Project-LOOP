"use client"

import { useEffect, useState } from "react"
import { getSourceLabel } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

const COLORS = ["#10b981", "#f59e0b", "#ef4444"]

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

interface SentimentDistribution {
  sentiment: string
  count: number
}

interface Stats {
  totalFeedback: number
  positivePercent: number
  negativePercent: number
  openIssues: number
  activeThemes: number
}

interface AnalyticsResponse {
  stats: Stats
  sentimentOverTime: SentimentPoint[]
  sourceBreakdown: SourceBreakdown[]
  topThemes: ThemeStat[]
  sentimentDistribution: SentimentDistribution[]
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    let cancelled = false

    async function fetchAnalytics() {
      try {
        const res = await fetch(`/api/analytics?days=${days}`)
        if (res.ok && !cancelled) {
          setAnalytics((await res.json()) as AnalyticsResponse)
        }
      } catch (err) {
        if (!cancelled) console.error(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchAnalytics()

    return () => {
      cancelled = true
    }
  }, [days])

  const handleDaysChange = (value: number) => {
    setDays(value)
    setLoading(true)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    )
  }

  const sentimentData = analytics?.sentimentOverTime || []
  const sourceData = (analytics?.sourceBreakdown || []).map((s) => ({
    name: getSourceLabel(s.source),
    count: s.count,
  }))
  const topThemes = analytics?.topThemes || []
  const sentimentDist = analytics?.sentimentDistribution || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-gray-500">Customer feedback intelligence</p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => handleDaysChange(d)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                days === d
                  ? "bg-violet-100 text-violet-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-gray-500">Total Feedback</p>
            <p className="text-3xl font-bold">{analytics?.stats?.totalFeedback?.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-gray-500">Positive</p>
            <p className="text-3xl font-bold text-emerald-600">{analytics?.stats?.positivePercent || 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-gray-500">Negative</p>
            <p className="text-3xl font-bold text-red-600">{analytics?.stats?.negativePercent || 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-gray-500">Open Issues</p>
            <p className="text-3xl font-bold text-amber-600">{analytics?.stats?.openIssues || 0}</p>
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

        <Card>
          <CardHeader>
            <CardTitle>Top Themes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topThemes.map((theme) => (
                <div key={theme.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{theme.name}</span>
                    <span className="text-gray-500">{theme.feedbackCount} items</span>
                  </div>
                  <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-violet-500"
                      style={{
                        width: `${Math.min(100, (theme.feedbackCount / (topThemes[0]?.feedbackCount || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                    <span className="text-emerald-600">+{theme.positiveCount}</span>
                    <span className="text-red-600">-{theme.negativeCount}</span>
                    <span>Trend: {theme.trendScore > 0 ? "+" : ""}{Math.round(theme.trendScore * 100)}%</span>
                  </div>
                </div>
              ))}
              {topThemes.length === 0 && (
                <p className="text-sm text-gray-500">No themes detected yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sentiment Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="sentiment"
                >
                  {sentimentDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}