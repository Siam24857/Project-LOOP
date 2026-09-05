export interface SessionUser {
  id: string
  name: string
  email: string
  role: "ADMIN" | "ANALYST" | "VIEWER"
  workspaceId: string
  workspaceName: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface FeedbackWithThemes {
  id: string
  workspaceId: string
  source: string
  customerName: string
  customerEmail: string
  content: string
  sentiment: string
  category: string | null
  status: string
  priority: string
  language: string
  createdAt: Date
  updatedAt: Date
  themes: {
    theme: {
      id: string
      name: string
    }
  }[]
}

export interface ThemeWithStats {
  id: string
  name: string
  description: string | null
  feedbackCount: number
  positiveCount: number
  negativeCount: number
  trendScore: number
  createdAt: Date
}

export interface ReportData {
  id: string
  title: string
  summary: string
  content: string
  reportData: unknown
  createdAt: Date
  updatedAt: Date
}

export interface AIClassification {
  sentiment: "positive" | "negative" | "neutral"
  category: string
  priority: "low" | "medium" | "high" | "urgent"
  summary: string
  themes: string[]
}

export interface AskLoopResponse {
  answer: string
  supportingFeedback: {
    id: string
    content: string
    sentiment: string
    source: string
    customerName: string
    createdAt: Date
  }[]
}
