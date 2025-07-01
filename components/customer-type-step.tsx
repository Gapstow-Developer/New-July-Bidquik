"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CustomerTypeStepProps {
  onSelect: (type: "residential" | "commercial") => void
}

export function CustomerTypeStep({ onSelect }: CustomerTypeStepProps) {
  const trackCalculatorStart = async (customerType: "residential" | "commercial") => {
    try {
      await fetch("/api/track-calculator-start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_type: customerType,
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
          referrer: typeof document !== "undefined" ? document.referrer : null,
        }),
      })
    } catch (error) {
      console.error("Failed to track calculator start:", error)
      // Don't interrupt user flow if tracking fails
    }
  }

  const handleSelect = async (type: "residential" | "commercial") => {
    await trackCalculatorStart(type)
    onSelect(type)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900">Get Your Free Quote</CardTitle>
          <p className="text-lg text-gray-600 mt-2">Choose your customer type to get started</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => handleSelect("residential")}
              variant="outline"
              className="h-32 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 border-2 hover:border-blue-300"
            >
              <div className="text-4xl">🏠</div>
              <div className="text-xl font-semibold">Residential</div>
              <div className="text-sm text-gray-600 text-center">Homeowners & residential properties</div>
            </Button>

            <Button
              onClick={() => handleSelect("commercial")}
              variant="outline"
              className="h-32 flex flex-col items-center justify-center space-y-2 hover:bg-green-50 border-2 hover:border-green-300"
            >
              <div className="text-4xl">🏢</div>
              <div className="text-xl font-semibold">Commercial</div>
              <div className="text-sm text-gray-600 text-center">Businesses & commercial properties</div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
