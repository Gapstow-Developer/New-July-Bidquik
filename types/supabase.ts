export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      settings: {
        Row: {
          id: string
          business_name: string
          business_address: string | null
          business_phone: string | null
          business_email: string | null
          primary_color: string | null
          secondary_color: string | null
          form_title: string | null
          form_subtitle: string | null
          notification_emails: string[] | null
          created_at: string
          updated_at: string
          discount_percentage: number | null
          discount_enabled: boolean | null
          discount_message: string | null
          discount_type: string | null
          story_multipliers: Json | null
          story_flat_fees: Json | null
          post_construction_markup_percentage: number | null
          logo_url: string | null
          business_email_template: string | null
          customer_email_template: string | null
          followup_email_template: string | null
          form_type: string | null
          followup_enabled: boolean | null
          followup_delay_hours: number | null
          gmail_client_id: string | null
          gmail_client_secret: string | null
          gmail_refresh_token: string | null
          sendgrid_api_key: string | null
          google_client_id: string | null
          google_client_secret: string | null
          blob_read_write_token: string | null
          twilio_account_sid: string | null
          twilio_auth_token: string | null
          twilio_phone_number: string | null
          pressure_washing_enabled: boolean | null
          serpapi_api_key: string | null
          // REMOVED: pressure_washing_per_sqft_price: number | null
          // REMOVED: pressure_washing_flat_fee: number | null
          // REMOVED: pressure_washing_minimum_price: number | null
          // REMOVED: pressure_washing_story_multipliers: Json | null
          // REMOVED: pressure_washing_story_flat_fees: Json | null
        }
        Insert: {
          id?: string
          business_name?: string
          business_address?: string | null
          business_phone?: string | null
          business_email?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          form_title?: string | null
          form_subtitle?: string | null
          notification_emails?: string[] | null
          created_at?: string
          updated_at?: string
          discount_percentage?: number | null
          discount_enabled?: boolean | null
          discount_message?: string | null
          discount_type?: string | null
          story_multipliers?: Json | null
          story_flat_fees?: Json | null
          post_construction_markup_percentage?: number | null
          logo_url?: string | null
          business_email_template?: string | null
          customer_email_template?: string | null
          followup_email_template?: string | null
          form_type?: string | null
          followup_enabled?: boolean | null
          followup_delay_hours?: number | null
          gmail_client_id?: string | null
          gmail_client_secret?: string | null
          gmail_refresh_token?: string | null
          sendgrid_api_key?: string | null
          google_client_id?: string | null
          google_client_secret?: string | null
          blob_read_write_token?: string | null
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          twilio_phone_number?: string | null
          pressure_washing_enabled?: boolean | null
          serpapi_api_key?: string | null
          // REMOVED: pressure_washing_per_sqft_price?: number | null
          // REMOVED: pressure_washing_flat_fee?: number | null
          // REMOVED: pressure_washing_minimum_price?: number | null
          // REMOVED: pressure_washing_story_multipliers?: Json | null
          // REMOVED: pressure_washing_story_flat_fees?: Json | null
        }
        Update: {
          id?: string
          business_name?: string
          business_address?: string | null
          business_phone?: string | null
          business_email?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          form_title?: string | null
          form_subtitle?: string | null
          notification_emails?: string[] | null
          created_at?: string
          updated_at?: string
          discount_percentage?: number | null
          discount_enabled?: boolean | null
          discount_message?: string | null
          discount_type?: string | null
          story_multipliers?: Json | null
          story_flat_fees?: Json | null
          post_construction_markup_percentage?: number | null
          logo_url?: string | null
          business_email_template?: string | null
          customer_email_template?: string | null
          followup_email_template?: string | null
          form_type?: string | null
          followup_enabled?: boolean | null
          followup_delay_hours?: number | null
          gmail_client_id?: string | null
          gmail_client_secret?: string | null
          gmail_refresh_token?: string | null
          sendgrid_api_key?: string | null
          google_client_id?: string | null
          google_client_secret?: string | null
          blob_read_write_token?: string | null
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          twilio_phone_number?: string | null
          pressure_washing_enabled?: boolean | null
          serpapi_api_key?: string | null
          // REMOVED: pressure_washing_per_sqft_price?: number | null
          // REMOVED: pressure_washing_flat_fee?: number | null
          // REMOVED: pressure_washing_minimum_price?: number | null
          // REMOVED: pressure_washing_story_multipliers?: Json | null
          // REMOVED: pressure_washing_story_flat_fees?: Json | null
        }
      }
      services: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          per_sqft_price: number | null
          flat_fee: number | null
          use_both_pricing: boolean
          minimum_price: number | null
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
          display_name: string | null // Added this for better display in UI
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          per_sqft_price?: number | null
          flat_fee?: number | null
          use_both_pricing?: boolean
          minimum_price?: number | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
          display_name?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          per_sqft_price?: number | null
          flat_fee?: number | null
          use_both_pricing?: boolean
          minimum_price?: number | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
          display_name?: string | null
        }
      }
      form_fields: {
        Row: {
          id: string
          field_name: string
          display_name: string
          placeholder: string | null
          is_required: boolean
          field_type: string
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          field_name: string
          display_name: string
          placeholder?: string | null
          is_required?: boolean
          field_type: string
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          field_name?: string
          display_name?: string
          placeholder?: string | null
          is_required?: boolean
          field_type?: string
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      quotes: {
        Row: {
          id: string
          customer_name: string | null
          customer_email: string | null
          customer_phone: string | null
          address: string | null
          square_footage: number | null
          stories: number | null
          service_type: string | null
          addons: string[] | null
          final_price: number | null
          status: string
          last_step_completed: number
          notes: string | null
          created_at: string
          updated_at: string
          has_skylights: boolean | null
          additional_services: Json | null
          quote_data: Json | null
          distance: number | null
          customer_type: string | null
        }
        Insert: {
          id?: string
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          address?: string | null
          square_footage?: number | null
          stories?: number | null
          service_type?: string | null
          addons?: string[] | null
          final_price?: number | null
          status?: string
          last_step_completed?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          has_skylights?: boolean | null
          additional_services?: Json | null
          quote_data?: Json | null
          distance?: number | null
          customer_type?: string | null
        }
        Update: {
          id?: string
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          address?: string | null
          square_footage?: number | null
          stories?: number | null
          service_type?: string | null
          addons?: string[] | null
          final_price?: number | null
          status?: string
          last_step_completed?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          has_skylights?: boolean | null
          additional_services?: Json | null
          quote_data?: Json | null
          distance?: number | null
          customer_type?: string | null
        }
      }
    }
  }
}
