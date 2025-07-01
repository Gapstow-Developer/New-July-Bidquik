import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { getSettings } from "@/lib/get-settings"

export const dynamic = "force-dynamic" // don’t run at build-time

export async function POST(req: NextRequest) {
  try {
    const { to, subject, text, html } = await req.json()

    // 1. obtain the API key
    const settings = await getSettings()
    const apiKey = settings.sendgrid_api_key ?? process.env.SENDGRID_API_KEY ?? settings.resend_api_key

    if (!apiKey) {
      return NextResponse.json({ error: "Missing Resend/SENDGRID API key in settings or env" }, { status: 500 })
    }

    // 2. create the client *after* we have the key
    const resend = new Resend(apiKey)

    const data = await resend.emails.send({
      from: "BidQuick <no-reply@bidquick.io>",
      to,
      subject,
      text,
      html,
    })

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error("💥 send-email error:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
