import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-")
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + "..."
}

export function getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case "POSITIVE": return "text-emerald-600 bg-emerald-50"
    case "NEGATIVE": return "text-red-600 bg-red-50"
    default: return "text-amber-600 bg-amber-50"
  }
}

export function getSentimentLabel(sentiment: string): string {
  switch (sentiment) {
    case "POSITIVE": return "Positive"
    case "NEGATIVE": return "Negative"
    default: return "Neutral"
  }
}

export function getSourceLabel(source: string): string {
  switch (source) {
    case "APP_REVIEW": return "App Review"
    case "SALES": return "Sales"
    case "MANUAL": return "Manual"
    case "SIMULATED": return "Simulated"
    default: return source.charAt(0) + source.slice(1).toLowerCase()
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "NEW": return "text-blue-600 bg-blue-50"
    case "REVIEWED": return "text-purple-600 bg-purple-50"
    case "RESOLVED": return "text-emerald-600 bg-emerald-50"
    default: return "text-gray-600 bg-gray-50"
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "URGENT": return "text-red-600 bg-red-50"
    case "HIGH": return "text-orange-600 bg-orange-50"
    case "MEDIUM": return "text-amber-600 bg-amber-50"
    default: return "text-gray-600 bg-gray-50"
  }
}
