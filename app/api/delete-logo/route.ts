import { NextResponse } from "next/server"
import { del as deleteBlob } from "@vercel/blob"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    await deleteBlob(url)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("Error deleting logo:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
