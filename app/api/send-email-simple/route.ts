import type React from "react"
import { EmailTemplate } from "../../../components/emails/email-template"
import { NextResponse } from "next/server"
import { Resend } from "resend"
import { getSettings } from "@/lib/get-settings"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, subject, message } = body

    const settings = await getSettings()

    const resend = new Resend(settings.sendgrid_api_key)

    const data = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: [email],
      subject: subject,
      react: EmailTemplate({ firstName: "John", message: message }) as React.ReactElement,
    })

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error })
  }
}
