"use client"

import { useState, useEffect } from "react" // Import useEffect
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"

// Define the form schema
const formSchema = z.object({
  business_name: z.string().min(2, {
    message: "Business name must be at least 2 characters.",
  }),
  business_address: z.string().optional(),
  business_phone: z.string().optional(),
  business_email: z.string().email().optional().or(z.literal("")),
  primary_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Please enter a valid hex color code (e.g. #3695bb)",
  }),
  secondary_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Please enter a valid hex color code (e.g. #2a7a9a)",
  }),
  form_title: z.string().min(2, {
    message: "Form title must be at least 2 characters.",
  }),
  form_subtitle: z.string().optional(),
  notification_emails: z.string().optional(),
  logo_url: z.string().optional(),
  form_type: z.enum(["residential", "commercial", "both"]).default("both"),
  pressure_washing_enabled: z.boolean().default(false),
})

type SettingsFormValues = z.infer<typeof formSchema>

export function GeneralSettingsForm({
  initialSettings,
  onSettingsSaved,
}: {
  initialSettings: any
  onSettingsSaved?: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    // defaultValues will be set by useEffect below
  })

  // Use useEffect to reset form values when initialSettings changes
  useEffect(() => {
    if (initialSettings) {
      const defaultValues: Partial<SettingsFormValues> = {
        business_name: initialSettings.business_name || "Window Cleaning Business",
        business_address: initialSettings.business_address || "",
        business_phone: initialSettings.business_phone || "",
        business_email: initialSettings.business_email || "",
        primary_color: initialSettings.primary_color || "#3695bb",
        secondary_color: initialSettings.secondary_color || "#2a7a9a",
        form_title: initialSettings.form_title || "Window Cleaning Calculator",
        form_subtitle:
          initialSettings.form_subtitle || "Get an instant quote for professional window cleaning services",
        notification_emails: initialSettings.notification_emails?.join(", ") || "",
        logo_url: initialSettings.logo_url || "",
        form_type: initialSettings.form_type || "both",
        pressure_washing_enabled: initialSettings.pressure_washing_enabled ?? false,
      }
      form.reset(defaultValues)
      console.log("Form reset with initial settings:", defaultValues) // Debug log
    }
  }, [initialSettings, form]) // Depend on initialSettings and form instance

  async function onSubmit(values: SettingsFormValues) {
    setIsLoading(true)
    console.log("Submitting form with values:", values) // Debug log

    try {
      const notificationEmails = values.notification_emails
        ? values.notification_emails.split(",").map((email) => email.trim())
        : []

      const response = await fetch("/api/settings/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          notification_emails: notificationEmails,
        }),
      })

      const data = await response.json()
      console.log("API response after update:", data) // Debug log

      if (!response.ok) {
        throw new Error(data.message || "Failed to update settings")
      }

      toast({
        title: "Settings Updated",
        description: "Your settings have been successfully updated.",
      })

      console.log("onSettingsSaved called") // Debug log
      onSettingsSaved?.()
    } catch (error: any) {
      console.error("Error during settings update:", error) // Debug log
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>Configure your business information and calculator appearance.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Business Information</h3>

              <FormField
                control={form.control}
                name="business_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Business Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="business_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Your business address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="business_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="business_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="info@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Business Logo</h3>

              <FormField
                control={form.control}
                name="logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Logo</FormLabel>
                    <div className="space-y-4">
                      {field.value && (
                        <div className="flex items-center space-x-4">
                          <img
                            src={field.value || "/placeholder.svg"}
                            alt="Business logo"
                            className="h-16 w-auto object-contain border rounded"
                          />
                          <Button type="button" variant="outline" onClick={() => field.onChange("")}>
                            Remove Logo
                          </Button>
                        </div>
                      )}
                      <div className="flex items-center space-x-4">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              // Show loading state
                              const formData = new FormData()
                              formData.append("file", file)

                              try {
                                const response = await fetch("/api/upload-logo", {
                                  method: "POST",
                                  body: formData,
                                })

                                const result = await response.json()

                                if (response.ok && result.success) {
                                  field.onChange(result.url)
                                  toast({
                                    title: "Logo Uploaded",
                                    description: "Your logo has been uploaded successfully.",
                                  })
                                } else {
                                  throw new Error(result.message || "Failed to upload logo")
                                }
                              } catch (error: any) {
                                console.error("Failed to upload logo:", error)
                                toast({
                                  title: "Upload Failed",
                                  description: error.message || "Failed to upload logo",
                                  variant: "destructive",
                                })
                              }
                            }
                          }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Upload a logo image. If no logo is provided, your business name will be displayed instead.
                      </p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Calculator Appearance</h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="primary_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Color</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="#3695bb" {...field} />
                        </FormControl>
                        <div className="h-10 w-10 rounded-md border" style={{ backgroundColor: field.value }} />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="secondary_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary Color</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="#2a7a9a" {...field} />
                        </FormControl>
                        <div className="h-10 w-10 rounded-md border" style={{ backgroundColor: field.value }} />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="form_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Form Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Window Cleaning Calculator" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="form_subtitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Form Subtitle</FormLabel>
                    <FormControl>
                      <Input placeholder="Get an instant quote for professional window cleaning services" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Form Display</h3>
              <p className="text-sm text-muted-foreground">Choose which type of form to display on the landing page.</p>
              <FormField
                control={form.control}
                name="form_type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3">
                          <RadioGroupItem value="residential" id="residential" />
                          <FormLabel htmlFor="residential">Residential Only</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3">
                          <RadioGroupItem value="commercial" id="commercial" />
                          <FormLabel htmlFor="commercial">Commercial Only</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3">
                          <RadioGroupItem value="both" id="both" />
                          <FormLabel htmlFor="both">Both (Residential & Commercial)</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Service Options</h3>
              <FormField
                control={form.control}
                name="pressure_washing_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Enable Exterior Cleaning (Pressure Washing)</FormLabel>
                      <FormDescription>
                        Allow customers to select pressure washing services in addition to window cleaning.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Notifications</h3>

              <FormField
                control={form.control}
                name="notification_emails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notification Emails</FormLabel>
                    <FormControl>
                      <Input placeholder="email1@example.com, email2@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Comma-separated list of email addresses that will receive notifications when a quote is submitted.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
