"use client"

import { useCallback } from "react"
import { useToastManager, toast } from "@/components/ui/toast"

export function useToast() {
  const { toasts } = useToastManager()

  const showToast = useCallback(
    (options: { title: string; description?: string; type?: "success" | "error" | "info" | "warning" }) => {
      toast.add({
        title: options.title,
        description: options.description,
        type: options.type || "info",
      })
    },
    []
  )

  return { toast: showToast, toasts }
}