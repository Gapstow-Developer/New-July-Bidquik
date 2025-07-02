import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { auth } from "@clerk/nextjs/server"

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  try {
    const data = await request.json()

    if (!data.organization_id) {
      return NextResponse.json(
        { success: false, message: "Organization ID is required for quote submission" },
        { status: 400 },
      )
    }

    const quoteData = {
      ...data,
      status: "submitted",
      last_step_completed: 4,
    }

    const { data: newQuote, error } = await supabase.from("quotes").insert(quoteData).select().single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: "Quote saved successfully",
      id: newQuote.id,
      data: newQuote,
    })
  } catch (error: any) {
    console.error("❌ Quote API error:", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to save quote" }, { status: 500 })
  }
}

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { orgId } = auth()

  if (!orgId) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { data: quotes, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: quotes || [],
    })
  } catch (error: any) {
    console.error("Error fetching quotes:", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to fetch quotes" }, { status: 500 })
  }
}
