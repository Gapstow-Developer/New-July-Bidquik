import { createServerSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

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

    const { data: services, error } = await supabase
      .from("services")
      .select("*")
      .eq("organization_id", orgId)
      .order("display_order", { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: services || [],
    })
  } catch (error: any) {
    console.error("Error fetching services:", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to fetch services" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { orgId } = auth()

  if (!orgId) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await request.json()

    const { data: newService, error } = await supabase
      .from("services")
      .insert({
        ...data,
        organization_id: orgId,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: newService,
      message: "Service created successfully",
    })
  } catch (error: any) {
    console.error("Error creating service:", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to create service" }, { status: 500 })
  }
}
