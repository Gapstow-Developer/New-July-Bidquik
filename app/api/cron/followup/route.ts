import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🕐 Cron job triggered: checking incomplete quotes")

    // Call the check-incomplete-quotes endpoint
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

    console.log(`Attempting to fetch from: ${baseUrl}/api/check-incomplete-quotes`)

    const response = await fetch(`${baseUrl}/api/check-incomplete-quotes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ check-incomplete-quotes API call failed with status ${response.status}: ${errorText}`)
      throw new Error(`Failed to check incomplete quotes: ${errorText}`)
    }

    const result = await response.json()

    console.log("✅ Cron job result:", result)

    return NextResponse.json({
      success: true,
      message: "Cron job executed successfully",
      result,
    })
  } catch (error: any) {
    console.error("❌ Cron job error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Cron job failed",
      },
      { status: 500 },
    )
  }
}

// Also support POST for flexibility
export async function POST() {
  return GET()
}
