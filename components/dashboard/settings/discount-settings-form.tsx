"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { CardContent, CardFooter } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  discount_percentage: z.coerce.number().min(0).max(50).default(15),
  discount_enabled: z.boolean().default(true),
  discount_message: z.string().optional(),
  discount_type: z.enum(["visual_only", "actual"]).default("visual_only"),
})

type DiscountFormValues = z.infer<typeof formSchema>

export function DiscountSettingsForm({ initialSettings }: { initialSettings: any }) {
  const [isLoading, setIsLoading] = useState(false)

  const defaultValues: Partial<DiscountFormValues> = {
    discount_percentage: initialSettings?.discount_percentage ?? 15,
    discount_enabled: initialSettings?.discount_enabled ?? true,
    discount_message: initialSettings?.discount_message || "Start your quote to see if you qualify for a discount!",
    discount_type: initialSettings?.discount_type || "visual_only",
  }

  const form = useForm<DiscountFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  async function onSubmit(values: DiscountFormValues) {
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
        throw new Error(data.message || "Failed to update discount settings")
      }

      toast({
        title: "Discount Settings Updated",
        description: "Your discount settings have been successfully updated.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update discount settings",
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
              name="discount_enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Enable Discount Display</FormLabel>
                    <FormDescription>
                      When enabled, customers will see crossed-out "original" prices and a discount message.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {form.watch("discount_enabled") && (
              <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                <FormField
                  control={form.control}
                  name="discount_type"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Discount Type</FormLabel>
                      <FormDescription>
                        Current selection: <strong>{field.value}</strong>
                      </FormDescription>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="space-y-3">
                          <FormItem className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                            <FormControl>
                              <RadioGroupItem value="visual_only" id="visual_only" className="mt-1" />
                            </FormControl>
                            <div className="flex-1">
                              <FormLabel htmlFor="visual_only" className="font-medium cursor-pointer">
                                Visual Discount Only (Recommended)
                              </FormLabel>
                              <FormDescription className="mt-1">
                                Show crossed-out "original" prices but charge your full calculated rate. Pure psychology
                                - no impact on your revenue.
                              </FormDescription>
                            </div>
                          </FormItem>

                          <FormItem className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                            <FormControl>
                              <RadioGroupItem value="actual" id="actual" className="mt-1" />
                            </FormControl>
                            <div className="flex-1">
                              <FormLabel htmlFor="actual" className="font-medium cursor-pointer">
                                Actual Discount
                              </FormLabel>
                              <FormDescription className="mt-1">
                                Apply a real discount to your calculated prices. Customers pay less - impacts your
                                revenue.
                              </FormDescription>
                            </div>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discount_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Percentage</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="50" placeholder="15" {...field} />
                      </FormControl>
                      <FormDescription>
                        Percentage discount to display (0-50%).{" "}
                        {form.watch("discount_type") === "actual"
                          ? "This will reduce the final price shown to customers."
                          : "The actual prices remain the same - this only affects the visual presentation."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discount_message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Message (Step 1)</FormLabel>
                      <FormControl>
                        <Input placeholder="Start your quote to see if you qualify for a discount!" {...field} />
                      </FormControl>
                      <FormDescription>Message shown on step 1 to encourage users to continue.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-900 mb-2">How Discount Display Works</h4>
            {form.watch("discount_type") === "actual" ? (
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• Your calculated prices will be reduced by the discount percentage</li>
                <li>• Customers will see both the original price and their discounted price</li>
                <li>• The final price will be lower than your standard rates</li>
                <li>• This affects your revenue - use for special promotions</li>
              </ul>
            ) : (
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• Your actual pricing remains unchanged</li>
                <li>• Customers see "original" prices that are marked up by the discount percentage</li>
                <li>• The crossed-out price shows what they would have paid "without the discount"</li>
                <li>• They pay your actual calculated price, but feel like they're getting a deal</li>
              </ul>
            )}
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
