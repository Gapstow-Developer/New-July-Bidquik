import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    console.log("📝 Incomplete Quote API called")

    const supabase = createServerSupabaseClient()
    const data = await request.json()

    console.log("📝 Incomplete quote data received:", {
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      service_type: data.service_type,
      customer_type: data.customer_type,
      session_id: data.session_id,
    })

    // Prepare the incomplete quote data
    const incompleteQuoteData = {
      session_id: data.session_id,
      customer_name: data.customer_name || "Unknown",
      customer_email: data.customer_email || "unknown@example.com",
      customer_phone: data.customer_phone || "",
      address: data.address || "",
      customer_type: data.customer_type || "residential",
      service_type: data.service_type || "window-cleaning",
      status: "incomplete",
      last_step_completed: data.last_step_completed || 2,
      quote_data: data.quote_data || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("📝 Prepared incomplete quote data:", incompleteQuoteData)

    // Insert incomplete quote
    const { data: newIncompleteQuote, error } = await supabase
      .from("quotes")
      .insert(incompleteQuoteData)
      .select()
      .single()

    if (error) {
      console.error("❌ Database insert error:", error)
      throw new Error(`Database error: ${error.message}`)
    }

    console.log("✅ Incomplete quote created successfully:", newIncompleteQuote.id)

    return NextResponse.json({
      success: true,
      message: "Incomplete quote saved successfully",
      id: newIncompleteQuote.id,
      data: newIncompleteQuote,
    })
  } catch (error: any) {
    console.error("❌ Incomplete Quote API error:", error)

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to save incomplete quote",
        error: error.toString(),
      },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (email) {
      // Get incomplete quotes for specific email
      const { data: quotes, error } = await supabase
        .from("quotes")
        .select("*")
        .eq("customer_email", email)
        .eq("status", "incomplete")
        .order("updated_at", { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch incomplete quotes: ${error.message}`)
      }

      return NextResponse.json({
        success: true,
        data: quotes || [],
      })
    } else {
      // Get all incomplete quotes
      const { data: quotes, error } = await supabase
        .from("quotes")
        .select("*")
        .eq("status", "incomplete")
        .order("created_at", { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch incomplete quotes: ${error.message}`)
      }

      return NextResponse.json({
        success: true,
        data: quotes || [],
      })
    }
  } catch (error: any) {
    console.error("Error fetching incomplete quotes:", error)

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch incomplete quotes",
      },
      { status: 500 },
    )
  }
}
