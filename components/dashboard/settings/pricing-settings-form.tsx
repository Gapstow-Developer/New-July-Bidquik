"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { CardContent, CardFooter } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  post_construction_markup_percentage: z.coerce.number().min(0).max(100).default(70),
  story_multipliers: z.record(z.string(), z.coerce.number().min(0).max(1)).default({ "1": 0, "2": 0.02, "3": 0.06 }),
  story_flat_fees: z.record(z.string(), z.coerce.number().min(0)).default({ "3": 300 }),
})

type PricingFormValues = z.infer<typeof formSchema>

export function PricingSettingsForm({ initialSettings }: { initialSettings: any }) {
  const [isLoading, setIsLoading] = useState(false)

  const defaultValues: Partial<PricingFormValues> = {
    post_construction_markup_percentage: initialSettings?.post_construction_markup_percentage ?? 70,
    story_multipliers: initialSettings?.story_multipliers || { "1": 0, "2": 0.02, "3": 0.06 },
    story_flat_fees: initialSettings?.story_flat_fees || { "3": 300 },
  }

  const form = useForm<PricingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  async function onSubmit(values: PricingFormValues) {
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
        throw new Error(data.message || "Failed to update pricing settings")
      }

      toast({
        title: "Pricing Settings Updated",
        description: "Your pricing settings have been successfully updated.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update pricing settings",
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
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Post-Construction Markup</h3>
              <p className="text-sm text-gray-600 mb-4">
                Apply a markup to quotes for post-construction cleaning jobs.
              </p>
              <FormField
                control={form.control}
                name="post_construction_markup_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Markup Percentage</FormLabel>
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Input type="number" step="1" min="0" max="100" placeholder="70" {...field} />
                      </FormControl>
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                    <FormMessage />
                    <p className="text-xs text-gray-500 mt-1">
                      e.g., 70% markup means the price will be multiplied by 1.7x.
                    </p>
                  </FormItem>
                )}
              />
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Story Multipliers</h3>
              <p className="text-sm text-gray-600 mb-4">
                These multipliers are added to the per-square-foot rate for each story level.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {["1", "2", "3"].map((story) => (
                  <FormField
                    key={story}
                    control={form.control}
                    name={`story_multipliers.${story}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {story} {story === "1" ? "Story" : "Stories"}
                        </FormLabel>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">+$</span>
                          <FormControl>
                            <Input type="number" step="0.01" min="0" max="1" placeholder="0.00" {...field} />
                          </FormControl>
                          <span className="text-sm text-gray-500">/sq ft</span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Example:</strong> If your base rate is $0.50/sq ft and 2-story multiplier is $0.02, then
                  2-story properties will be charged $0.52/sq ft.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Story Flat Fees</h3>
              <p className="text-sm text-gray-600 mb-4">
                Additional flat fees added for specific story levels (independent of square footage).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {["1", "2", "3"].map((story) => (
                  <FormField
                    key={story}
                    control={form.control}
                    name={`story_flat_fees.${story}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {story} {story === "1" ? "Story" : "Stories"}
                        </FormLabel>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">+$</span>
                          <FormControl>
                            <Input type="number" min="0" step="25" placeholder="0" {...field} />
                          </FormControl>
                          <span className="text-sm text-gray-500">flat</span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Set to $0 to disable flat fees for that story level. Flat fees are added after
                  the per-square-foot calculation.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Current Pricing Structure</h4>
              <div className="space-y-2 text-sm">
                {["1", "2", "3"].map((story) => {
                  const multiplier = form.watch(`story_multipliers.${story}`) || 0
                  const flatFee = form.watch(`story_flat_fees.${story}`) || 0
                  return (
                    <div key={story} className="flex justify-between">
                      <span>
                        {story} {story === "1" ? "Story" : "Stories"}:
                      </span>
                      <span>
                        Base Rate + ${multiplier.toFixed(2)}/sq ft
                        {flatFee > 0 && ` + $${flatFee} flat fee`}
                      </span>
                    </div>
                  )
                })}
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
              "Save Pricing Settings"
            )}
          </Button>
        </CardFooter>
      </form>
    </Form>
  )
}
