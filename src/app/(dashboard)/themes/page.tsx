"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react"
import type { ThemeWithStats } from "@/types"

export default function ThemesPage() {
  const [themes, setThemes] = useState<ThemeWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [detecting, setDetecting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch("/api/themes")
        if (res.ok && !cancelled) {
          setThemes((await res.json()) as ThemeWithStats[])
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
  }, [])

  const handleDetectThemes = async () => {
    setDetecting(true)
    try {
      const res = await fetch("/api/ai/themes", { method: "POST" })
      if (res.ok) {
        const themesRes = await fetch("/api/themes")
        if (themesRes.ok) {
          setThemes((await themesRes.json()) as ThemeWithStats[])
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setDetecting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Themes</h1>
          <p className="text-sm text-gray-500">AI-detected feedback themes and trends</p>
        </div>
        <button
          onClick={handleDetectThemes}
          disabled={detecting}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {detecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {detecting ? "Detecting..." : "Detect Themes"}
        </button>
      </div>

      {themes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-2">No themes detected yet.</p>
            <button
              onClick={handleDetectThemes}
              disabled={detecting}
              className="text-sm font-medium text-violet-600 hover:text-violet-700"
            >
              Detect themes from your feedback
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme) => {
            const trendDirection = theme.trendScore > 0.1 ? "up" : theme.trendScore < -0.1 ? "down" : "stable"
            return (
              <Card key={theme.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{theme.name}</span>
                    <div className="flex items-center gap-1">
                      {trendDirection === "up" && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                      {trendDirection === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
                      {trendDirection === "stable" && <Minus className="h-4 w-4 text-gray-400" />}
                      <span className="text-xs text-gray-500">
                        {theme.trendScore > 0 ? "+" : ""}{Math.round(theme.trendScore * 100)}%
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {theme.description && (
                    <p className="text-sm text-gray-600 mb-3">{theme.description}</p>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Total feedback</span>
                      <span className="font-medium">{theme.feedbackCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Positive</span>
                      <span className="font-medium text-emerald-600">{theme.positiveCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Negative</span>
                      <span className="font-medium text-red-600">{theme.negativeCount}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden mt-2">
                      <div
                        className="h-full bg-violet-500 rounded-full"
                        style={{ width: `${Math.min(100, theme.feedbackCount * 5)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}