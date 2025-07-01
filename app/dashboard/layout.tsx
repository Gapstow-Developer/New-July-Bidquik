// app/dashboard/layout.tsx
import type React from "react"
import { Inter } from "next/font/google"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { UserNav } from "@/components/dashboard/user-nav"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { QueryProvider } from "@/components/providers/query-provider" // Import QueryProvider

const inter = Inter({ subsets: ["latin"] })

// Mark the layout as dynamic to prevent static rendering issues
export const dynamic = "force-dynamic"

async function getSettings() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: settings } = await supabase.from("settings").select("*").single()
    return settings
  } catch (error) {
    console.error("Error loading settings:", error)
    return null
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let session = null

  try {
    session = await getServerSession(authOptions)
    console.log("Session in layout:", session) // This will show in Vercel logs
  } catch (error) {
    console.error("Error getting session in layout:", error)
    redirect("/auth/signin")
  }

  if (!session) {
    redirect("/auth/signin")
  }

  const settings = await getSettings()

  // Create a safe user object
  const safeUser = {
    name: session?.user?.name || null,
    email: session?.user?.email || null,
    image: session?.user?.image || null,
  }

  return (
    <QueryProvider>
      {" "}
      {/* Wrap the entire dashboard content with QueryProvider */}
      <div className={`${inter.className} min-h-screen bg-background`}>
        <div
          className="border-b"
          style={{
            background: `linear-gradient(to right, ${settings?.primary_color || "#3695bb"}, ${settings?.secondary_color || "#2a7a9a"})`,
          }}
        >
          <div className="flex h-16 items-center px-4">
            <div className="flex items-center space-x-4">
              {settings?.logo_url ? (
                <img
                  src={settings.logo_url || "/placeholder.svg"}
                  alt={settings.business_name || "Business Logo"}
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <h1 className="text-xl font-semibold text-white">{settings?.business_name || "Dashboard"}</h1>
              )}
            </div>
            <div className="ml-auto flex items-center space-x-4">
              <UserNav user={safeUser} />
            </div>
          </div>
        </div>
        <div className="flex">
          <div className="hidden border-r bg-gray-100/40 md:block md:w-[220px] lg:w-[280px]">
            <div className="flex h-full max-h-screen flex-col gap-2">
              <div className="flex-1 overflow-auto p-2">
                <DashboardNav />
              </div>
            </div>
          </div>
          <div className="flex-1">
            <main className="flex-1 space-y-4 p-4 md:p-8">{children}</main>
          </div>
        </div>
      </div>
    </QueryProvider>
  )
}
