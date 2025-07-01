"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { CardContent, CardFooter } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  business_email_template: z.string().optional(),
  customer_email_template: z.string().optional(),
  followup_email_template: z.string().optional(),
  followup_enabled: z.boolean().default(true),
  followup_delay_hours: z.coerce.number().min(1).max(720).default(24),
})

type EmailTemplatesFormValues = z.infer<typeof formSchema>

export function EmailTemplatesForm({ initialSettings }: { initialSettings: any }) {
  const [isLoading, setIsLoading] = useState(false)

  const defaultValues: Partial<EmailTemplatesFormValues> = {
    business_email_template:
      initialSettings?.business_email_template ||
      `NEW WINDOW CLEANING QUOTE REQUEST

QUOTE AMOUNT: ${{ finalPrice }}

CUSTOMER INFORMATION:
- Name: {{customerName}}
- Email: {{customerEmail}}
- Phone: {{customerPhone}}
- Address: {{address}}

PROPERTY DETAILS:
- Square Footage: {{squareFootage}} sq ft
- Number of Stories: {{stories}}
- Service Type: {{serviceType}}

SERVICES REQUESTED:
{{services}}

FINAL QUOTE: ${{ finalPrice }}

Generated: {{timestamp}}`,
    customer_email_template:
      initialSettings?.customer_email_template ||
      `Dear {{customerName}},

Thank you for requesting a quote from {{businessName}}.

YOUR QUOTE DETAILS:
- Service: {{serviceType}}
- Property: {{address}}
- Total Quote: ${{ finalPrice }}

Someone from our team will contact you within 24 hours to schedule your service.

Best regards,
{{businessName}}`,
    followup_email_template:
      initialSettings?.followup_email_template ||
      `Hi {{customerName}},

I noticed you started getting a quote for window cleaning services but didn't complete the process. I'd love to help you get the best service possible!

{{#if finalPrice}}
Your Quote Summary:
Service: {{serviceType}}
Address: {{address}}
{{#if squareFootage}}Square Footage: {{squareFootage}} sq ft{{/if}}
Estimated Price: ${{ finalPrice }}
{{/if}}

Why Choose {{businessName}}?
- ✅ Fully insured and bonded
- ✅ 100% satisfaction guarantee
- ✅ Competitive pricing with no hidden fees
- ✅ Professional, reliable service
- ✅ Free estimates

🎉 Special Offer Just for You!
Get 10% off your first service when you book within the next 48 hours!

Ready to get started?
Reply to this email or call us at {{businessPhone}}
We're here to answer any questions and earn your business!

Best regards,
{{businessName}}
{{businessPhone}} | {{businessEmail}}`,
    followup_enabled: initialSettings?.followup_enabled ?? true,
    followup_delay_hours: initialSettings?.followup_delay_hours ?? 24,
  }

  const form = useForm<EmailTemplatesFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  async function onSubmit(values: EmailTemplatesFormValues) {
    setIsLoading(true)
    try {
      const response = await fetch("/api/settings/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to update email templates")
      }

      toast({
        title: "Email Templates Updated",
        description: "Your email templates have been successfully updated.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update email templates",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="business_email_template"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Notification Email Template</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Email template for business notifications..."
                      className="min-h-[200px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This template is used for emails sent to your business when a quote is submitted.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customer_email_template"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Confirmation Email Template</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Email template for customer confirmations..."
                      className="min-h-[200px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This template is used for confirmation emails sent to customers after they submit a quote.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
              <h4 className="text-lg font-medium">Follow-up Email Settings</h4>
              <FormField
                control={form.control}
                name="followup_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Enable Automated Follow-up Emails</FormLabel>
                      <FormDescription>
                        Automatically send follow-up emails to customers who start but don't complete a quote.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch("followup_enabled") && (
                <FormField
                  control={form.control}
                  name="followup_delay_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Follow-up Delay (Hours)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="720" placeholder="24" {...field} />
                      </FormControl>
                      <FormDescription>
                        Number of hours to wait before sending the follow-up email (e.g., 24 for 1 day). Max 720 hours
                        (30 days).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="followup_email_template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Follow-up Email Template</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Email template for follow-up emails..."
                        className="min-h-[200px] font-mono text-sm"
                        {...field}
                        disabled={!form.watch("followup_enabled")}
                      />
                    </FormControl>
                    <FormDescription>
                      This template is used for automated follow-up emails to incomplete quotes.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Available Variables:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                <div>{`{{customerName}}`} - Customer's name</div>
                <div>{`{{customerEmail}}`} - Customer's email</div>
                <div>{`{{customerPhone}}`} - Customer's phone</div>
                <div>{`{{address}}`} - Property address</div>
                <div>{`{{finalPrice}}`} - Final quote amount</div>
                <div>{`{{serviceType}}`} - Service type selected</div>
                <div>{`{{squareFootage}}`} - Property square footage</div>
                <div>{`{{stories}}`} - Number of stories</div>
                <div>{`{{businessName}}`} - Your business name</div>
                <div>{`{{timestamp}}`} - Current date/time</div>
                <div>{`{{#if finalPrice}}...{{/if}}`} - Conditional block for price</div>
                <div>{`{{#if squareFootage}}...{{/if}}`} - Conditional block for square footage</div>
              </div>
            </div>
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
  )
}
