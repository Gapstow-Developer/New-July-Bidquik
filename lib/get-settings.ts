/**
 * Centralised helper for retrieving the Settings record.
 * Will never throw: returns an empty object if the request fails.
 */
export type Settings = {
  sendgrid_api_key?: string
  blob_read_write_token?: string
  twilio_account_sid?: string
  twilio_auth_token?: string
  twilio_phone_number?: string
  business_email?: string
  contact_form_recipient?: string
  contact_form_sender?: string
  serpapi_api_key?: string // Added SerpAPI key
  [key: string]: unknown
}

export async function getSettings(): Promise<Settings> {
  try {
    // Works in dev and production-preview; NEXTAUTH_URL is set in prod
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const res = await fetch(`${baseUrl}/api/settings`, { cache: "no-store" })
    if (!res.ok) throw new Error(`Settings fetch responded ${res.status}`)
    const json = await res.json()
    return (json?.data ?? {}) as Settings
  } catch (err) {
    console.error("⚠️  getSettings():", err)
    return {}
  }
}
