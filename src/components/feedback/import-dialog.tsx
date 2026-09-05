"use client"

import { useRef, useState } from "react"
import { Upload, FileText, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react"

interface ImportError {
  row: number
  errors: string[]
}

interface SampleRow {
  source: string
  customerName: string
  customerEmail: string
  content: string
  createdAt: Date
}

interface PreviewResponse {
  validCount: number
  invalidCount: number
  errors: ImportError[]
  sampleData: SampleRow[]
}

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = "idle" | "previewing" | "confirming" | "done" | "error"

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState("")
  const [fileContent, setFileContent] = useState("")
  const [step, setStep] = useState<Step>("idle")
  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const reset = () => {
    setFileName("")
    setFileContent("")
    setStep("idle")
    setPreview(null)
    setMessage("")
    setLoading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const close = () => {
    reset()
    onOpenChange(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setMessage("Please choose a .csv file")
      setStep("error")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const content = String(reader.result ?? "")
      setFileName(file.name)
      setFileContent(content)
      setStep("previewing")
      setMessage("")
      void upload(content, false)
    }
    reader.readAsText(file)
  }

  const upload = async (csvData: string, confirm: boolean) => {
    setLoading(true)
    try {
      const res = await fetch("/api/feedback/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvData, confirm }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setMessage(data?.error || "Import failed. Please check the CSV format.")
        setStep("error")
        return
      }

      if (!confirm) {
        const data = (await res.json()) as { preview: PreviewResponse }
        setPreview(data.preview)
        setStep("previewing")
      } else {
        const data = (await res.json()) as { message: string; imported: number; invalid: number }
        setMessage(`${data.message}${data.invalid > 0 ? ` (${data.invalid} rows skipped)` : ""}`)
        setStep("done")
      }
    } catch {
      setMessage("Network error while importing. Please try again.")
      setStep("error")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    setStep("confirming")
    void upload(fileContent, true)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Import feedback from CSV</h2>
          <button
            onClick={close}
            disabled={loading}
            className="rounded-lg px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
          />

          {step === "idle" && (
            <>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-10 text-center hover:border-violet-400"
              >
                <Upload className="h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm font-medium">Click to choose a CSV file</p>
                <p className="text-xs text-gray-500">
                  Columns: content (required), customer_name, customer_email, source, created_at
                </p>
              </div>
              {message && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{message}</p>
              )}
            </>
          )}

          {(step === "previewing" || step === "confirming") && preview && (
            <>
              <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{fileName}</span>
                </div>
                {loading && <Loader2 className="h-4 w-4 animate-spin text-violet-500" />}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{preview.validCount}</p>
                  <p className="text-xs text-emerald-700">Valid rows</p>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{preview.invalidCount}</p>
                  <p className="text-xs text-red-700">Invalid rows</p>
                </div>
              </div>

              {preview.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto rounded-lg border bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-500">Validation issues:</p>
                  <ul className="mt-1 space-y-1">
                    {preview.errors.map((item) => (
                      <li key={item.row} className="flex items-start gap-2 text-xs text-red-600">
                        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                        <span>
                          Row {item.row}: {item.errors.join("; ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {preview.sampleData.length > 0 && (
                <div className="rounded-lg border bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-500">Sample rows:</p>
                  {preview.sampleData.map((row, index) => (
                    <div key={index} className="mt-2 rounded border bg-white p-2">
                      <p className="line-clamp-2 text-xs text-gray-800">{row.content}</p>
                      <p className="mt-1 text-[11px] text-gray-500">
                        {row.customerName || "Anonymous"} · {row.source}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={close}
                  disabled={loading}
                  className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading || preview.validCount === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Import {preview.validCount} rows
                </button>
              </div>
            </>
          )}

          {step === "done" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center rounded-lg bg-emerald-50 p-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                <p className="mt-2 text-sm font-medium text-emerald-700">{message}</p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={close}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {step === "error" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center rounded-lg bg-red-50 p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <p className="mt-2 text-sm font-medium text-red-700">{message}</p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={reset}
                  className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Try another file
                </button>
                <button
                  onClick={close}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}