import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server" // Ensure this path is correct

export const dynamic = "force-dynamic" // Ensures this route is always dynamic

export async function GET(request: Request) {
  console.log("--- ENTERING /api/quotes/followup-sent GET handler ---")

  try {
    console.log("--- API: /api/quotes/followup-sent GET request received ---")

    let supabase
    try {
      supabase = createServerSupabaseClient()
      console.log("Supabase client created successfully.")
    } catch (clientError: any) {
      console.error("❌ Error creating Supabase client:", clientError.message)
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: `Failed to initialize database connection: ${clientError.message}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    if (!supabase) {
      console.error("❌ Supabase client is null after creation attempt.")
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Supabase client could not be initialized.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "10")
    const offset = (page - 1) * pageSize

    console.log(`Querying for sent follow-up emails: page=${page}, pageSize=${pageSize}, offset=${offset}`)

    const { data, count, error } = await supabase
      .from("quotes")
      .select("id, customer_name, customer_email, customer_phone, address, final_price, followup_sent_at, created_at", {
        count: "exact",
      })
      .not("followup_sent_at", "is", null)
      .order("followup_sent_at", { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error("❌ Supabase query failed:", error.message)
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: `Database query failed: ${error.message}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log(`✅ Successfully fetched ${data?.length || 0} records. Total count: ${count}`)

    return new NextResponse(
      JSON.stringify({
        success: true,
        data,
        pagination: {
          total: count,
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error: any) {
    console.error("❌ Uncaught error in /api/quotes/followup-sent:", error.message, error.stack)
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: error.message || "An unexpected server error occurred while fetching sent follow-up emails.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

// Adding an empty POST handler as a common workaround for stubborn 405s
export async function POST(request: Request) {
  return new NextResponse(null, { status: 405, statusText: "Method Not Allowed" })
}
