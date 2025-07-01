import { NextResponse } from "next/server"
import { Resend } from "resend"
import { getSettings } from "@/lib/get-settings"

export async function POST(request: Request) {
  try {
    const settings = await getSettings()

    // Correctly parse FormData
    const formData = await request.formData()

    const businessName = formData.get("businessName") as string
    const contactName = formData.get("contactName") as string
    const contactEmail = formData.get("contactEmail") as string
    const contactPhone = formData.get("contactPhone") as string
    const propertyAddress = formData.get("propertyAddress") as string
    const propertyAddressDetails = formData.get("propertyAddressDetails") as string
    const buildingType = formData.get("buildingType") as string
    const numStories = formData.get("numStories") as string
    const approxNumWindows = formData.get("approxNumWindows") as string
    const serviceFrequency = formData.get("serviceFrequency") as string
    const accessNotes = formData.get("accessNotes") as string

    // Handle images (optional, for now just log their presence)
    const images = formData.getAll("images")
    if (images.length > 0) {
      console.log(`Received ${images.length} image(s) for commercial inquiry.`)
      // In a real application, you would upload these to Vercel Blob or similar storage
      // and include links in the email, or attach them if the email service supports it.
    }

    // Obtain the API key for Resend
    const apiKey =
      settings.resend_api_key ?? process.env.RESEND_API_KEY ?? settings.sendgrid_api_key ?? process.env.SENDGRID_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Missing Resend/SendGrid API key in settings or env" }, { status: 500 })
    }

    const resend = new Resend(apiKey)

    const subject = `New Commercial Inquiry from ${businessName || contactName}`
    const textContent = `
      Business Name: ${businessName}
      Contact Name: ${contactName}
      Contact Email: ${contactEmail}
      Contact Phone: ${contactPhone}
      Property Address: ${propertyAddress}
      Building Type: ${buildingType}
      Number of Stories: ${numStories}
      Approx. Number of Windows: ${approxNumWindows}
      Desired Service Frequency: ${serviceFrequency}
      Access Notes: ${accessNotes || "N/A"}
      Property Address Details: ${propertyAddressDetails ? JSON.parse(propertyAddressDetails).place_id : "N/A"}
      ${images.length > 0 ? `Images attached: ${images.length}` : ""}
    `
    const htmlContent = `
      <p><strong>Business Name:</strong> ${businessName}</p>
      <p><strong>Contact Name:</strong> ${contactName}</p>
      <p><strong>Contact Email:</strong> ${contactEmail}</p>
      <p><strong>Contact Phone:</strong> ${contactPhone}</p>
      <p><strong>Property Address:</strong> ${propertyAddress}</p>
      <p><strong>Building Type:</strong> ${buildingType}</p>
      <p><strong>Number of Stories:</strong> ${numStories}</p>
      <p><strong>Approx. Number of Windows:</strong> ${approxNumWindows}</p>
      <p><strong>Desired Service Frequency:</strong> ${serviceFrequency}</p>
      <p><strong>Access Notes:</strong> ${accessNotes || "N/A"}</p>
      <p><strong>Property Address Details (Place ID):</strong> ${propertyAddressDetails ? JSON.parse(propertyAddressDetails).place_id : "N/A"}</p>
      ${images.length > 0 ? `<p><strong>Images attached:</strong> ${images.length}</p>` : ""}
    `

    await resend.emails.send({
      from: settings.contact_form_sender || "BidQuick <no-reply@bidquick.io>", // Fallback sender
      to: settings.contact_form_recipient,
      subject: subject,
      text: textContent,
      html: htmlContent,
    })

    return NextResponse.json({ success: true, message: "Inquiry submitted successfully" }, { status: 200 })
  } catch (error: any) {
    console.error("💥 Commercial Inquiry Submission Error:", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to submit inquiry" }, { status: 500 })
  }
}
