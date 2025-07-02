import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { userId, orgId } = auth()

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { organizationId, organizationName, businessEmail } = await request.json()
    const supabase = createServerSupabaseClient()

    // Create initial settings for the organization
    const { data: settingsData, error: settingsError } = await supabase
      .from("settings")
      .insert({
        organization_id: organizationId,
        business_name: organizationName,
        business_email: businessEmail,
        primary_color: "#3695bb",
        secondary_color: "#2a7a9a",
        form_title: "Get Your Free Quote",
        form_subtitle: "Professional window cleaning services",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (settingsError) {
      throw new Error(`Failed to create settings: ${settingsError.message}`)
    }

    // Create default services for the organization
    const defaultServices = [
      {
        organization_id: organizationId,
        name: "exterior-only",
        display_name: "Exterior Only",
        category: "window-cleaning",
        per_sqft_price: 0.15,
        minimum_price: 75,
        is_active: true,
      },
      {
        organization_id: organizationId,
        name: "interior-exterior",
        display_name: "Interior & Exterior",
        category: "window-cleaning",
        per_sqft_price: 0.25,
        minimum_price: 125,
        is_active: true,
      },
      {
        organization_id: organizationId,
        name: "house-washing",
        display_name: "House Washing",
        category: "pressure-washing",
        per_sqft_price: 0.1,
        minimum_price: 200,
        is_active: true,
      },
    ]

    const { error: servicesError } = await supabase.from("services").insert(defaultServices)

    if (servicesError) {
      throw new Error(`Failed to create services: ${servicesError.message}`)
    }

    return NextResponse.json({
      success: true,
      message: "Organization initialized successfully",
      settings: settingsData,
    })
  } catch (error: any) {
    console.error("Error initializing organization:", error)
    return NextResponse.json({ error: error.message || "Failed to initialize organization" }, { status: 500 })
  }
}
