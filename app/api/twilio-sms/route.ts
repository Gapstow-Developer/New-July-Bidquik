import { NextResponse } from "next/server"
import twilio from "twilio"
import { getSettings } from "@/lib/get-settings"

export async function POST(request: Request) {
  try {
    const { to, body } = await request.json()

    if (!to || !body) {
      return new NextResponse("To and body are required", { status: 400 })
    }

    const settings = await getSettings()

    if (!settings.twilio_account_sid || !settings.twilio_auth_token || !settings.twilio_phone_number) {
      console.error("Twilio credentials not configured.")
      return new NextResponse("Twilio credentials not configured", { status: 500 })
    }

    const client = twilio(settings.twilio_account_sid, settings.twilio_auth_token)

    const message = await client.messages.create({
      body: body,
      to: to,
      from: settings.twilio_phone_number,
    })

    console.log(`SMS sent to ${to} with SID: ${message.sid}`)

    return NextResponse.json({ success: true, sid: message.sid })
  } catch (error: any) {
    console.error("Error sending SMS:", error)
    return new NextResponse(error.message || "Internal Server Error", { status: 500 })
  }
}
