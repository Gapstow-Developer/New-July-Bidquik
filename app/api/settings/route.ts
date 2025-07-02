import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { auth } from "@clerk/nextjs/server"

// Use a fixed UUID for the single settings row
const SETTINGS_ID = "00000000-0000-0000-0000-000000000001"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient()
  const { searchParams } = new URL(request.url)
  const publicOrgId = searchParams.get("org") // For public calculator page

  try {
    let orgId: string | null = null

    if (publicOrgId) {
      orgId = publicOrgId
    } else {
      const { orgId: authOrgId } = auth()
      orgId = authOrgId
    }

    if (!orgId) {
      return NextResponse.json({ success: false, message: "Organization ID is required" }, { status: 400 })
    }

    const { data, error } = await supabase.from("settings").select("*").eq("organization_id", orgId).single()

    if (error) {
      if (error.code === "PGRST116") {
        // Not found
        return NextResponse.json(
          { success: false, message: "Settings not found for this organization" },
          { status: 404 },
        )
      }
      throw error
    }

    const response = NextResponse.json({ success: true, data })
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")

    return response
  } catch (error: any) {
    console.error("Error in settings GET API:", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to fetch settings" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  try {
    const { theme } = await request.json()

    const { data, error } = await supabase.from("settings").upsert({ theme: theme }, { onConflict: "id" }).select()

    if (error) {
      console.error("Error updating settings:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
