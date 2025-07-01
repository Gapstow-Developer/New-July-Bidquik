"use client"

import { useState, useEffect } from "react"
import { CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

const formSchema = z.object({
  gmail_client_id: z.string().nullable(),
  gmail_client_secret: z.string().nullable(),
  gmail_refresh_token: z.string().nullable(),
  sendgrid_api_key: z.string().nullable(),
  google_client_id: z.string().nullable(),
  google_client_secret: z.string().nullable(),
  blob_read_write_token: z.string().nullable(),
  twilio_account_sid: z.string().nullable(),
  twilio_auth_token: z.string().nullable(),
  twilio_phone_number: z.string().nullable(),
  serpapi_api_key: z.string().nullable(), // Added SerpAPI key
})

type ApiKeysFormData = z.infer<typeof formSchema>

interface ApiKeysSettingsFormProps {
  initialSettings: any
}

export function ApiKeysSettingsForm({ initialSettings }: ApiKeysSettingsFormProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const form = useForm<ApiKeysFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gmail_client_id: initialSettings?.gmail_client_id || "",
      gmail_client_secret: initialSettings?.gmail_client_secret || "",
      gmail_refresh_token: initialSettings?.gmail_refresh_token || "",
      sendgrid_api_key: initialSettings?.sendgrid_api_key || "",
      google_client_id: initialSettings?.google_client_id || "",
      google_client_secret: initialSettings?.google_client_secret || "",
      blob_read_write_token: initialSettings?.blob_read_write_token || "",
      twilio_account_sid: initialSettings?.twilio_account_sid || "",
      twilio_auth_token: initialSettings?.twilio_auth_token || "",
      twilio_phone_number: initialSettings?.twilio_phone_number || "",
      serpapi_api_key: initialSettings?.serpapi_api_key || "", // Added SerpAPI key
    },
  })

  useEffect(() => {
    if (initialSettings) {
      form.reset({
        gmail_client_id: initialSettings.gmail_client_id || "",
        gmail_client_secret: initialSettings.gmail_client_secret || "",
        gmail_refresh_token: initialSettings.gmail_refresh_token || "",
        sendgrid_api_key: initialSettings.sendgrid_api_key || "",
        google_client_id: initialSettings.google_client_id || "",
        google_client_secret: initialSettings.google_client_secret || "",
        blob_read_write_token: initialSettings.blob_read_write_token || "",
        twilio_account_sid: initialSettings.twilio_account_sid || "",
        twilio_auth_token: initialSettings.twilio_auth_token || "",
        twilio_phone_number: initialSettings.twilio_phone_number || "",
        serpapi_api_key: initialSettings.serpapi_api_key || "", // Added SerpAPI key
      })
    }
  }, [initialSettings, form])

  const onSubmit = async (data: ApiKeysFormData) => {
    console.log("Attempting to save API keys. Data:", data); // Add this line
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/settings/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to save API keys")
      }

      setSuccess("API keys saved successfully!")
    } catch (err: any) {
      console.error("API keys save error:", err)
      setError(err.message || "Failed to save API keys")
    } finally {
      setSaving(false)
    }
  }

  return (
    <CardContent>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 mb-4">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Email Service API Keys</h3>
          <div>
            <Label htmlFor="sendgrid_api_key">SendGrid API Key</Label>
            <Input
              id="sendgrid_api_key"
              {...form.register("sendgrid_api_key")}
              placeholder="SG.YOUR_SENDGRID_API_KEY"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Used for sending emails via SendGrid.{" "}
              <a href="https://sendgrid.com/free/" target="_blank" rel="noopener noreferrer" className="underline">
                Create an account
              </a>{" "}
              or find your{" "}
              <a
                href="https://app.sendgrid.com/settings/api_keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                API Key here
              </a>
              .
            </p>
          </div>
          <div>
            <Label htmlFor="gmail_client_id">Gmail Client ID</Label>
            <Input id="gmail_client_id" {...form.register("gmail_client_id")} placeholder="YOUR_GMAIL_CLIENT_ID" />
            <p className="text-xs text-muted-foreground mt-1">
              Used for sending emails via Gmail API. Requires setting up an OAuth 2.0 Client ID in Google Cloud Console.{" "}
              <a
                href="https://console.cloud.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Go to Google Cloud Console
              </a>{" "}
              and navigate to{" "}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                APIs & Services &gt; Credentials
              </a>
              .
            </p>
          </div>
          <div>
            <Label htmlFor="gmail_client_secret">Gmail Client Secret</Label>
            <Input
              id="gmail_client_secret"
              {...form.register("gmail_client_secret")}
              placeholder="YOUR_GMAIL_CLIENT_SECRET"
            />
            <p className="text-xs text-muted-foreground mt-1">The secret associated with your Gmail Client ID.</p>
          </div>
          <div>
            <Label htmlFor="gmail_refresh_token">Gmail Refresh Token</Label>
            <Input
              id="gmail_refresh_token"
              {...form.register("gmail_refresh_token")}
              placeholder="YOUR_GMAIL_REFRESH_TOKEN"
            />
            <p className="text-xs text-muted-foreground mt-1">
              A long-lived token for accessing Gmail API without re-authenticating. This is typically obtained through
              an OAuth flow, not directly from the console.
            </p>
          </div>
          <div>
            <Label htmlFor="google_client_id">Google Client ID (General)</Label>
            <Input id="google_client_id" {...form.register("google_client_id")} placeholder="YOUR_GOOGLE_CLIENT_ID" />
            <p className="text-xs text-muted-foreground mt-1">
              General Google API Client ID, potentially used for other Google services like Maps.{" "}
              <a
                href="https://console.cloud.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Go to Google Cloud Console
              </a>{" "}
              and navigate to{" "}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                APIs & Services &gt; Credentials
              </a>
              .
            </p>
          </div>
          <div>
            <Label htmlFor="google_client_secret">Google Client Secret (General)</Label>
            <Input
              id="google_client_secret"
              {...form.register("google_client_secret")}
              placeholder="YOUR_GOOGLE_CLIENT_SECRET"
            />
            <p className="text-xs text-muted-foreground mt-1">
              The secret associated with your general Google Client ID.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Vercel Blob Storage</h3>
          <div>
            <Label htmlFor="blob_read_write_token">Vercel Blob Read/Write Token</Label>
            <Input
              id="blob_read_write_token"
              {...form.register("blob_read_write_token")}
              placeholder="vercel_blob_rw_YOUR_TOKEN"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Used for uploading and managing files (e.g., logos) with Vercel Blob.{" "}
              <a href="https://vercel.com/signup" target="_blank" rel="noopener noreferrer" className="underline">
                Create a Vercel account
              </a>{" "}
              and find your{" "}
              <a
                href="https://vercel.com/dashboard/stores/blob"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Blob store tokens here
              </a>
              .
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Twilio SMS Integration</h3>
          <div>
            <Label htmlFor="twilio_account_sid">Twilio Account SID</Label>
            <Input
              id="twilio_account_sid"
              {...form.register("twilio_account_sid")}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Your Twilio Account SID for sending SMS messages.{" "}
              <a
                href="https://www.twilio.com/try-twilio"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Create a Twilio account
              </a>{" "}
              and find your{" "}
              <a
                href="https://console.twilio.com/us1/account/keys-credentials/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Account SID and Auth Token here
              </a>
              .
            </p>
          </div>
          <div>
            <Label htmlFor="twilio_auth_token">Twilio Auth Token</Label>
            <Input id="twilio_auth_token" {...form.register("twilio_auth_token")} placeholder="your_auth_token" />
            <p className="text-xs text-muted-foreground mt-1">Your Twilio Auth Token.</p>
          </div>
          <div>
            <Label htmlFor="twilio_phone_number">Twilio Phone Number</Label>
            <Input id="twilio_phone_number" {...form.register("twilio_phone_number")} placeholder="+15017122661" />
            <p className="text-xs text-muted-foreground mt-1">
              The Twilio phone number you will use to send SMS messages.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">SerpAPI Integration</h3>
          <div>
            <Label htmlFor="serpapi_api_key">SerpAPI Key</Label>
            <Input id="serpapi_api_key" {...form.register("serpapi_api_key")} placeholder="YOUR_SERPAPI_KEY" />
            <p className="text-xs text-muted-foreground mt-1">
              Used for fetching property square footage.{" "}
              <a
                href="https://serpapi.com/users/sign_up"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Sign up for SerpAPI
              </a>{" "}
              and find your{" "}
              <a href="https://serpapi.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">
                API Key here
              </a>
              .
            </p>
          </div>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save API Keys"
          )}
        </Button>
      </form>
    </CardContent>
  )
}
