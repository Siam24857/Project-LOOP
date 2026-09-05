import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  workspaceName: z.string().min(2, "Workspace name must be at least 2 characters"),
})

export const feedbackSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  content: z.string().min(10, "Feedback must be at least 10 characters"),
  source: z.enum(["SUPPORT", "APP_REVIEW", "SURVEY", "SALES", "MANUAL", "SIMULATED"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
})

export const feedbackUpdateSchema = z.object({
  customerName: z.string().min(1).optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  content: z.string().min(10).optional(),
  source: z.enum(["SUPPORT", "APP_REVIEW", "SURVEY", "SALES", "MANUAL", "SIMULATED"]).optional(),
  sentiment: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]).optional(),
  category: z.string().optional(),
  status: z.enum(["NEW", "REVIEWED", "RESOLVED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
})

export const askLoopSchema = z.object({
  question: z.string().min(5, "Question must be at least 5 characters"),
})

export const reportSchema = z.object({
  title: z.string().min(1, "Report title is required"),
})

export const csvRowSchema = z.object({
  source: z.string().optional(),
  customer_name: z.string().optional(),
  customer_email: z.string().optional(),
  content: z.string().optional(),
  created_at: z.string().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type FeedbackInput = z.infer<typeof feedbackSchema>
export type FeedbackUpdateInput = z.infer<typeof feedbackUpdateSchema>
export type AskLoopInput = z.infer<typeof askLoopSchema>
export type ReportInput = z.infer<typeof reportSchema>
