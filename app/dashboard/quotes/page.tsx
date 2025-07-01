import type { Metadata } from "next"
import { QuotesTable } from "@/components/dashboard/quotes-table"
import { createServerSupabaseClient } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { unstable_noStore } from "next/cache" // Added import

// Force dynamic rendering
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Quotes - Window Cleaning Calculator",
  description: "View and manage submitted quotes from your window cleaning calculator",
}

// Add these lines after the existing exports
export const revalidate = 0
export const fetchCache = "force-no-store"

export default async function QuotesPage() {
  unstable_noStore() // Added call to prevent caching

  let quotes = []
  let error = null

  try {
    const supabase = createServerSupabaseClient()

    // Add timestamp to bust cache
    const timestamp = Date.now()
    const { data, error: fetchError } = await supabase
      .from("quotes")
      .select("*")
      .order("created_at", { ascending: false })

    if (fetchError) {
      console.error("Error fetching quotes:", fetchError)
      error = fetchError.message
    } else {
      quotes = data || []
    }
  } catch (err: any) {
    console.error("Error in quotes page:", err)
    error = err.message || "Unknown error occurred"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Quotes</h2>
        <div className="text-sm text-muted-foreground">{error ? "Error loading" : `Total: ${quotes.length}`}</div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error loading quotes: {error}
            <br />
            <span className="text-sm">Check your database connection and ensure the quotes table exists.</span>
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border">
        <QuotesTable quotes={quotes} />
      </div>
    </div>
  )
}
