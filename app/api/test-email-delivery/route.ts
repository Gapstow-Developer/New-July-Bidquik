import { NextResponse } from "next/server"
import { Resend } from "resend"
import { getSettings } from "@/lib/get-settings"
import { EmailTemplate } from "@/components/emails/email-template"

export const dynamic = "force-dynamic" // prevent execution during build

export async function GET() {
  try {
    // 1. load key
    const settings = await getSettings()
    const apiKey = settings.sendgrid_api_key ?? process.env.SENDGRID_API_KEY ?? settings.resend_api_key

    if (!apiKey) {
      return NextResponse.json({ error: "Missing Resend/SENDGRID API key in settings or env" }, { status: 500 })
    }

    // 2. instantiate only when the key is available
    const resend = new Resend(apiKey)

    const data = await resend.emails.send({
      from: "BidQuick <no-reply@bidquick.io>",
      to: ["delivered@resend.dev"],
      subject: "BidQuick test e-mail",
      react: EmailTemplate({ firstName: "John" }),
    })

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error("💥 test-email-delivery error:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
