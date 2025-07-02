import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"

export async function POST(request: Request) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, metadata } = await request.json()

    // Create organization in Clerk
    const organization = await clerkClient.organizations.createOrganization({
      name,
      createdBy: userId,
      publicMetadata: metadata,
    })

    return NextResponse.json({
      id: organization.id,
      name: organization.name,
      metadata: organization.publicMetadata,
    })
  } catch (error: any) {
    console.error("Error creating organization:", error)
    return NextResponse.json({ error: error.message || "Failed to create organization" }, { status: 500 })
  }
}
