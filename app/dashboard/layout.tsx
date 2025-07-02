import type React from "react"
import { Inter } from "next/font/google"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { UserNav } from "@/components/dashboard/user-nav"
import { OrganizationSwitcher } from "@clerk/nextjs"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { QueryProvider } from "@/components/providers/query-provider"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"

const inter = Inter({ subsets: ["latin"] })

export const dynamic = "force-dynamic"

async function getSettings(orgId: string) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: settings } = await supabase.from("settings").select("*").eq("organization_id", orgId).single()
    return settings
  } catch (error) {
    console.error("Error loading settings for org:", orgId, error)
    return null
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId, orgId } = auth()

  if (!userId) {
    redirect("/sign-in")
  }

  if (!orgId) {
    redirect("/onboarding")
  }

  const settings = await getSettings(orgId)

  return (
    <QueryProvider>
      <div className={`${inter.className} min-h-screen bg-background`}>
        <div
          className="border-b"
          style={{
            background: `linear-gradient(to right, ${settings?.primary_color || "#3695bb"}, ${settings?.secondary_color || "#2a7a9a"})`,
          }}
        >
          <div className="flex h-16 items-center px-4">
            <div className="flex items-center space-x-4">
              <OrganizationSwitcher
                hidePersonal={true}
                appearance={{
                  elements: {
                    organizationSwitcherTriggerIcon: "text-white",
                    organizationSwitcherTrigger: "text-white hover:bg-white/10 p-2 rounded-md",
                  },
                }}
              />
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
              <UserNav />
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
