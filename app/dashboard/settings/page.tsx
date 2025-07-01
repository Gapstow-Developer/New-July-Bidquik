"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2, Eye, AlertTriangle } from "lucide-react"
import { ServicesTable } from "@/components/dashboard/settings/services-table"
import { GeneralSettingsForm } from "@/components/dashboard/settings/general-settings-form"
import { PricingSettingsForm } from "@/components/dashboard/settings/pricing-settings-form"
import { DiscountSettingsForm } from "@/components/dashboard/settings/discount-settings-form"
import { EmailTemplatesForm } from "@/components/dashboard/settings/email-templates-form"
import { ApiKeysSettingsForm } from "@/components/dashboard/settings/api-keys-settings-form"
import { ServiceAreaSettingsForm } from "@/components/dashboard/settings/service-area-settings-form"

// Force dynamic rendering
export const dynamic = "force-dynamic"

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load settings
  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Loading settings...")

      const response = await fetch("/api/settings?" + new Date().getTime(), {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to load settings: ${response.status}`)
      }

      const data = await response.json()
      console.log("API Response:", data)

      if (data.success && data.data) {
        console.log("Raw settings data:", data.data)
        setSettings(data.data)
      } else {
        console.log("No existing settings found, using defaults")
        setError("No settings found. Using default values.")
      }
    } catch (err: any) {
      console.error("Settings load error:", err)
      setError(err.message || "Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  // Preview the form
  const previewForm = () => {
    window.open("/", "_blank")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Configure your business settings and form appearance</p>
        </div>
        <Button onClick={previewForm} variant="outline" className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Preview Form
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="window-cleaning-pricing">Window Cleaning Pricing</TabsTrigger>
          <TabsTrigger value="pressure-washing-pricing">Pressure Washing Pricing</TabsTrigger>
          <TabsTrigger value="discount">Discount Settings</TabsTrigger>
          <TabsTrigger value="emails">Email Templates</TabsTrigger>
          <TabsTrigger value="service-settings">Service Settings</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          {loading ? (
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure your business information and branding.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : (
            <GeneralSettingsForm initialSettings={settings} onSettingsSaved={loadSettings} />
          )}
        </TabsContent>

        <TabsContent value="window-cleaning-pricing">
          {loading ? (
            <Card>
              <CardHeader>
                <CardTitle>Window Cleaning Pricing</CardTitle>
                <CardDescription>
                  Configure how pricing changes based on the number of stories and job type for window cleaning.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="mb-6">
                {" "}
                {/* Added Card wrapper for PricingSettingsForm */}
                <CardHeader>
                  <CardTitle>Story & Markup Pricing</CardTitle>
                  <CardDescription>
                    Configure global pricing adjustments for window cleaning based on stories and job type.
                  </CardDescription>
                </CardHeader>
                <PricingSettingsForm initialSettings={settings} />
              </Card>

              <Card>
                {" "}
                {/* Added Card wrapper for ServicesTable */}
                <CardHeader>
                  <CardTitle>Window Cleaning Services</CardTitle>
                  <CardDescription>Manage individual window cleaning services and their pricing.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ServicesTable categoryFilter={["main", "addon", "upsell"]} />
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="pressure-washing-pricing">
          <Card>
            <CardHeader>
              <CardTitle>Pressure Washing Pricing</CardTitle>
              <CardDescription>
                Manage pricing for your residential and commercial pressure washing services.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ServicesTable categoryFilter={["pressure-washing", "commercial-pressure-washing"]} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discount">
          <Card>
            <CardHeader>
              <CardTitle>Discount Settings</CardTitle>
              <CardDescription>Configure the discount display and messaging on your quote form.</CardDescription>
            </CardHeader>
            {loading ? (
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            ) : (
              <DiscountSettingsForm initialSettings={settings} />
            )}
          </Card>
        </TabsContent>

        <TabsContent value="emails">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Customize the email templates sent to you and your customers.</CardDescription>
            </CardHeader>
            {loading ? (
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            ) : (
              <EmailTemplatesForm initialSettings={settings} />
            )}
          </Card>
        </TabsContent>

        <TabsContent value="api-keys">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage API keys for integrated services.</CardDescription>
            </CardHeader>
            {loading ? (
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            ) : (
              <ApiKeysSettingsForm initialSettings={settings} />
            )}
          </Card>
        </TabsContent>

        <TabsContent value="service-settings">
          {loading ? (
            <Card>
              <CardHeader>
                <CardTitle>Service Settings</CardTitle>
                <CardDescription>Manage your service area and all available services.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : (
            <>
              <ServiceAreaSettingsForm />
              <ServicesTable /> {/* This will show ALL services */}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
