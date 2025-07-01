import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Create a server-side client with service role for admin operations
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL environment variable.")
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable for server client")
  }
  if (!supabaseServiceKey) {
    console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable.")
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable for server client")
  }

  try {
    const client = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    console.log("✅ Supabase server client initialized successfully.")
    return client
  } catch (e: any) {
    console.error("❌ Error during Supabase server client initialization:", e.message, e.stack)
    throw new Error(`Failed to initialize Supabase server client: ${e.message}`)
  }
}

// Alternative client creation function for different use cases
export const createAdminSupabaseClient = () => {
  return createServerSupabaseClient()
}
