import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

// Use a fixed UUID for the single settings row
const SETTINGS_ID = "00000000-0000-0000-0000-000000000001"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    console.log("=== SETTINGS GET API CALLED ===")
    console.log("Fetching settings with ID:", SETTINGS_ID)

    // Try to get existing settings
    const { data, error } = await supabase.from("settings").select("*").eq("id", SETTINGS_ID).single()

    console.log("Database query result:", { data, error })

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" error
      console.error("Error fetching settings:", error)
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Failed to fetch settings",
        },
        { status: 500 },
      )
    }

    // If no settings found, create default settings
    if (!data) {
      console.log("No settings found, creating defaults...")

      const defaultSettings = {
        id: SETTINGS_ID,
        business_name: "Your Business Name",
        business_email: "",
        business_phone: "",
        business_address: "",
        primary_color: "#3695bb",
        secondary_color: "#2a7a9a",
        form_title: "Window Cleaning Calculator",
        form_subtitle: "Get an instant quote for professional window cleaning services",
        logo_url: "",
        notification_emails: [],
        business_email_template: `NEW WINDOW CLEANING QUOTE REQUEST

QUOTE AMOUNT: $\{\{finalPrice\}\}

CUSTOMER INFORMATION:
- Name: $\{\{customerName\}\}
- Email: $\{\{customerEmail\}\}
- Phone: $\{\{customerPhone\}\}
- Address: $\{\{address\}\}

PROPERTY DETAILS:
- Square Footage: $\{\{squareFootage\}\} sq ft
- Number of Stories: $\{\{stories\}\}
- Service Type: $\{\{serviceType\}\}

SERVICES REQUESTED:
\{\{services\}\}

FINAL QUOTE: $\{\{finalPrice\}\}

Generated: $\{\{timestamp\}\}`,

        customer_email_template: `Dear $\{\{customerName\}\},

Thank you for requesting a quote from $\{\{businessName\}\}.

YOUR QUOTE DETAILS:
- Service: $\{\{serviceType\}\}
- Property: $\{\{address\}\}
- Total Quote: $\{\{finalPrice\}\}

Someone from our team will contact you within 24 hours to schedule your service.

Best regards,
\{\{businessName\}\}`,
        followup_email_template: `Hi $\{\{customerName\}\},

I noticed you started getting a quote for window cleaning services but didn't complete the process. I'd love to help you get the best service possible!

\{\{#if finalPrice\}\}
Your Quote Summary:
Service: $\{\{serviceType\}\}
Address: $\{\{address\}\}
\{\{#if squareFootage\}\}Square Footage: $\{\{squareFootage\}\} sq ft\{\{/if\}\}
Estimated Price: $\{\{finalPrice\}\}
\{\{/if\}\}

Why Choose $\{\{businessName\}\}?
- ✅ Fully insured and bonded
- ✅ 100% satisfaction guarantee
- ✅ Competitive pricing with no hidden fees
- ✅ Professional, reliable service
- ✅ Free estimates

🎉 Special Offer Just for You!
Get 10% off your first service when you book within the next 48 hours!

Ready to get started?
Reply to this email or call us at $\{\{businessPhone\}\}
We're here to answer any questions and earn your business!

Best regards,
$\{\{businessName\}\}
$\{\{businessPhone\}\} | $\{\{businessEmail\}\}`,
        discount_percentage: 15,
        discount_enabled: true,
        discount_message: "Start your quote to see if you qualify for a discount!",
        discount_type: "visual_only",
        post_construction_markup_percentage: 70.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        form_type: "both", // Ensure default is set
        followup_enabled: true,
        followup_delay_hours: 24,
        gmail_client_id: null,
        gmail_client_secret: null,
        gmail_refresh_token: null,
        sendgrid_api_key: null,
        google_client_id: null,
        google_client_secret: null,
        blob_read_write_token: null,
        twilio_account_sid: null,
        twilio_auth_token: null,
        twilio_phone_number: null,
        pressure_washing_enabled: false,
        serpapi_api_key: null,
      }

      console.log("Inserting default settings:", defaultSettings)

      const { data: newData, error: insertError } = await supabase
        .from("settings")
        .insert(defaultSettings)
        .select()
        .single()

      if (insertError) {
        console.error("Error creating default settings:", insertError)
        return NextResponse.json(
          {
            success: false,
            message: insertError.message || "Failed to create default settings",
          },
          { status: 500 },
        )
      }

      console.log("Created default settings:", newData)
      console.log("Default settings form_type:", newData.form_type) // Debug log
      return NextResponse.json({
        success: true,
        data: newData,
      })
    }

    console.log("Returning existing settings:", data)
    console.log("Existing settings form_type:", data.form_type) // Debug log
    console.log("Pressure washing enabled in returned data:", data.pressure_washing_enabled) // Debug log

    const response = NextResponse.json({
      success: true,
      data,
    })

    // Add cache control headers to prevent caching
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")

    return response
  } catch (error: any) {
    console.error("Error in settings GET API:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch settings",
      },
      { status: 500 },
    )
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
