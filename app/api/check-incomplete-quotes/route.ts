import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { renderEmailTemplate } from "@/lib/email-template-renderer" // Assuming you have this utility
import { sendEmail } from "@/app/api/send-followup-email/route" // Assuming this is your send email function

export const dynamic = "force-dynamic"

export async function POST() {
  const supabase = createServerSupabaseClient()

  try {
    console.log("Starting check for incomplete quotes...")

    // 1. Fetch settings to check if follow-up is enabled and get delay
    const { data: settings, error: settingsError } = await supabase
      .from("settings")
      .select(
        "followup_enabled, followup_delay_hours, business_name, business_phone, business_email, followup_email_template",
      )
      .eq("id", "00000000-0000-0000-0000-000000000001")
      .single()

    if (settingsError || !settings) {
      console.error("Error fetching settings or settings not found:", settingsError)
      return NextResponse.json({ success: false, message: "Failed to fetch settings for follow-up." }, { status: 500 })
    }

    if (!settings.followup_enabled) {
      console.log("Follow-up emails are disabled in settings. Skipping cron job.")
      return NextResponse.json({ success: true, message: "Follow-up emails are disabled." })
    }

    const followupDelayHours = settings.followup_delay_hours || 24 // Default to 24 hours if not set
    const cutoffTime = new Date(Date.now() - followupDelayHours * 60 * 60 * 1000).toISOString()

    console.log(`Checking for incomplete quotes older than ${followupDelayHours} hours (${cutoffTime})...`)

    // 2. Fetch incomplete quotes that haven't been followed up yet
    const { data: incompleteQuotes, error: quotesError } = await supabase
      .from("quotes")
      .select("*")
      .eq("status", "incomplete")
      .is("followup_sent_at", null) // Only send if followup_sent_at is NULL
      .lt("updated_at", cutoffTime) // Only if updated before the cutoff time
      .not("customer_email", "is", null) // Ensure email exists
      .not("customer_email", "eq", "") // Ensure email is not empty
      .limit(100) // Limit to prevent overwhelming the system

    if (quotesError) {
      console.error("Error fetching incomplete quotes:", quotesError)
      return NextResponse.json({ success: false, message: "Failed to fetch incomplete quotes." }, { status: 500 })
    }

    if (!incompleteQuotes || incompleteQuotes.length === 0) {
      console.log("No incomplete quotes found for follow-up.")
      return NextResponse.json({ success: true, message: "No incomplete quotes found for follow-up." })
    }

    console.log(`Found ${incompleteQuotes.length} incomplete quotes to follow up.`)

    const sentEmails: { quoteId: string; email: string; status: string; error?: string }[] = []

    for (const quote of incompleteQuotes) {
      try {
        if (!quote.customer_email) {
          console.warn(`Skipping quote ${quote.id} due to missing customer email.`)
          sentEmails.push({ quoteId: quote.id, email: "N/A", status: "skipped", error: "Missing customer email" })
          continue
        }

        // Prepare data for email template
        const templateData = {
          customerName: quote.customer_name || "Valued Customer",
          customerEmail: quote.customer_email,
          customerPhone: quote.customer_phone || "N/A",
          address: quote.address || "N/A",
          finalPrice: quote.final_price ? `$${quote.final_price.toFixed(2)}` : "N/A",
          serviceType: quote.service_type || "N/A",
          squareFootage: quote.square_footage || "N/A",
          stories: quote.stories || "N/A",
          businessName: settings.business_name || "Your Business",
          businessPhone: settings.business_phone || "N/A",
          businessEmail: settings.business_email || "N/A",
          timestamp: new Date().toLocaleString(),
          // Pass conditional flags for Handlebars
          finalPriceExists: !!quote.final_price,
          squareFootageExists: !!quote.square_footage,
        }

        const emailSubject = `Following Up On Your Quote From ${settings.business_name}`
        const emailBody = renderEmailTemplate(settings.followup_email_template || "", templateData)

        // Send the email
        const emailResult = await sendEmail({
          to: quote.customer_email,
          subject: emailSubject,
          html: emailBody,
        })

        if (emailResult.success) {
          // Update the quote with followup_sent_at timestamp
          const { error: updateError } = await supabase
            .from("quotes")
            .update({ followup_sent_at: new Date().toISOString() })
            .eq("id", quote.id)

          if (updateError) {
            console.error(`Error updating followup_sent_at for quote ${quote.id}:`, updateError)
            sentEmails.push({
              quoteId: quote.id,
              email: quote.customer_email,
              status: "sent_but_update_failed",
              error: updateError.message,
            })
          } else {
            console.log(`Successfully sent follow-up email to ${quote.customer_email} for quote ${quote.id}`)
            sentEmails.push({ quoteId: quote.id, email: quote.customer_email, status: "sent" })
          }
        } else {
          console.error(
            `Failed to send follow-up email to ${quote.customer_email} for quote ${quote.id}:`,
            emailResult.error,
          )
          sentEmails.push({
            quoteId: quote.id,
            email: quote.customer_email,
            status: "failed",
            error: emailResult.error,
          })
        }
      } catch (emailProcessError: any) {
        console.error(`Unexpected error processing quote ${quote.id}:`, emailProcessError)
        sentEmails.push({
          quoteId: quote.id,
          email: quote.customer_email || "N/A",
          status: "error",
          error: emailProcessError.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Follow-up process completed. Sent ${sentEmails.filter((e) => e.status === "sent").length} emails.`,
      details: sentEmails,
    })
  } catch (error: any) {
    console.error("Error in check-incomplete-quotes API:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to check incomplete quotes",
      },
      { status: 500 },
    )
  }
}
