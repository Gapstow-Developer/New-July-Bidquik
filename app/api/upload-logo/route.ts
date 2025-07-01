import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { getSettings } from "@/lib/get-settings"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const settings = await getSettings()
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get("filename") || "file"

    /**
     * The `put` method is part of the Vercel Blob SDK.
     * @see https://vercel.com/docs/storage/vercel-blob
     */
    const blob = await put(filename, request.body, {
      access: "public",
      token: settings.blob_read_write_token,
    })

    return NextResponse.json(blob)
  } catch (error) {
    console.error("Error uploading logo:", error)
    return NextResponse.json({ error: "Failed to upload logo" }, { status: 500 })
  }
}
