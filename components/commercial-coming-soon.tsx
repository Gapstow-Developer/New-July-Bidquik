"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Wrench } from "lucide-react"

interface CommercialComingSoonProps {
  onBack: () => void
  settings: any // Pass settings for dynamic title/subtitle
}

export function CommercialComingSoon({ onBack, settings }: CommercialComingSoonProps) {
  return (
    <div className="min-h-screen bg-black p-4 md:p-8 flex items-center justify-center">
      <Card className="w-full max-w-md shadow-2xl overflow-hidden">
        <CardHeader
          className="text-white text-center py-6 sm:py-8"
          style={{
            background: `linear-gradient(to right, ${settings?.primary_color || "#3695bb"}, ${settings?.secondary_color || "#2a7a9a"})`,
          }}
        >
          <div className="flex items-center justify-center mb-4">
            {settings?.logo_url ? (
              <img
                src={settings.logo_url || "/placeholder.svg"}
                alt={settings.business_name || "Business Logo"}
                className="h-16 w-auto object-contain"
              />
            ) : (
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                {settings?.form_title || "Window Cleaning Calculator"}
              </h1>
            )}
          </div>
          {settings?.logo_url && (
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
              {settings?.form_title || "Window Cleaning Calculator"}
            </h1>
          )}
          <p className="text-sm sm:text-lg opacity-90">
            {settings?.form_subtitle || "Get an instant quote based on real property data"}
          </p>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 space-y-6 text-center bg-white">
          <Wrench className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-black">Commercial Functionality Coming Soon!</h2>
          <p className="text-slate-600 mb-6">
            We are actively working on our commercial quoting system. Please check back soon, or contact us directly for
            a commercial estimate.
          </p>
          <Button onClick={onBack} variant="outline" className="border-slate-300 hover:bg-slate-50">
            Go Back to Selection
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
