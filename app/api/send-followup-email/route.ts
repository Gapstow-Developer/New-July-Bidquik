import { NextResponse } from "next/server"
import sgMail from "@sendgrid/mail"
import { getSettings } from "@/lib/get-settings"

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const settings = await getSettings()

  if (!settings?.sendgrid_api_key) {
    throw new Error("Missing SendGrid API Key")
  }

  sgMail.setApiKey(settings.sendgrid_api_key)

  await sgMail.send({
    to,
    from: settings.business_email || "noreply@example.com",
    subject,
    html,
  })
}

export async function POST(request: Request) {
  try {
    const settings = await getSettings()
    const body = await request.json()

    if (!body.email || !body.name || !body.message) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    if (!settings.sendgrid_api_key) {
      return NextResponse.json({ message: "Missing SendGrid API Key" }, { status: 500 })
    }

    const htmlContent = `Hello ${body.name}, <br><br>${body.message}`

    await sendEmail(body.email, "Follow up email", htmlContent)

    return NextResponse.json({ message: "Email sent successfully" }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: "Failed to send email" }, { status: 500 })
  }
}
