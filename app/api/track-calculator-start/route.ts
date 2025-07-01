import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const data = await request.json()

    console.log("📊 Calculator start tracked:", data.customer_type)

    // Insert a record to track calculator starts
    const { error } = await supabase.from("calculator_starts").insert({
      customer_type: data.customer_type,
      created_at: new Date().toISOString(),
      user_agent: data.user_agent || null,
      referrer: data.referrer || null,
    })

    if (error) {
      console.error("❌ Error tracking calculator start:", error)
      // Don't fail the request if tracking fails
    }

    return NextResponse.json({
      success: true,
      message: "Calculator start tracked",
    })
  } catch (error: any) {
    console.error("❌ Calculator start tracking error:", error)

    // Return success even if tracking fails to not interrupt user flow
    return NextResponse.json({
      success: true,
      message: "Calculator start tracking failed but continuing",
    })
  }
}
