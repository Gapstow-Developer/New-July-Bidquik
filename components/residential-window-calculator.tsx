"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/types/supabase"

type Service = Database["public"]["Tables"]["services"]["Row"]
type Settings = Database["public"]["Tables"]["settings"]["Row"]

interface ResidentialWindowCalculatorProps {
  customerData: {
    name: string
    email: string
    phone: string
    address: string
    addressDetails: any
  }
  settings: Settings
  onBack: () => void
  onSubmit: (quoteData: any) => void
}

export function ResidentialWindowCalculator({
  customerData,
  settings,
  onBack,
  onSubmit,
}: ResidentialWindowCalculatorProps) {
  const { toast } = useToast()
  const [services, setServices] = useState<Service[]>([])
  const [squareFootage, setSquareFootage] = useState<number>(0)
  const [stories, setStories] = useState<number>(1)
  const [serviceType, setServiceType] = useState<string>("")
  const [addons, setAddons] = useState<string[]>([])
  const [hasSkylights, setHasSkylights] = useState(false)
  const [additionalServices, setAdditionalServices] = useState<string[]>([])
  const [finalPrice, setFinalPrice] = useState<number>(0)

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/services")
        const data = await response.json()
        if (data.success) {
          setServices(data.data)
        }
      } catch (error) {
        console.error("Error fetching services:", error)
      }
    }
    fetchServices()
  }, [])

  // Estimate square footage
  useEffect(() => {
    const estimateSquareFootage = async () => {
      if (customerData.addressDetails?.lat && customerData.addressDetails?.lng) {
        try {
          const response = await fetch("/api/get-square-footage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              address: customerData.address,
              lat: customerData.addressDetails.lat,
              lng: customerData.addressDetails.lng,
            }),
          })
          const data = await response.json()
          if (data.success && data.squareFootage) {
            setSquareFootage(data.squareFootage)
          }
        } catch (error) {
          console.error("Error estimating square footage:", error)
        }
      }
    }
    estimateSquareFootage()
  }, [customerData])

  // Calculate price
  const calculatePrice = useCallback(() => {
    let price = 0

    // Base service price
    if (serviceType) {
      const service = services.find((s) => s.name === serviceType && s.category === "window-cleaning")
      if (service) {
        let servicePrice = 0

        if (service.use_both_pricing) {
          servicePrice = squareFootage * (service.per_sqft_price || 0) + (service.flat_fee || 0)
        } else if (service.per_sqft_price) {
          servicePrice = squareFootage * service.per_sqft_price
        } else if (service.flat_fee) {
          servicePrice = service.flat_fee
        }

        // Apply story multiplier
        const storyMultiplier = settings.story_multipliers?.[stories.toString()] || 0
        servicePrice *= 1 + storyMultiplier

        // Apply story flat fee
        const storyFlatFee = settings.story_flat_fees?.[stories.toString()] || 0
        servicePrice += storyFlatFee

        // Apply minimum price
        if (service.minimum_price && servicePrice < service.minimum_price) {
          servicePrice = service.minimum_price
        }

        price += servicePrice
      }
    }

    // Add-ons
    addons.forEach((addonName) => {
      const addon = services.find((s) => s.name === addonName && s.category === "window-cleaning-addon")
      if (addon) {
        price += addon.flat_fee || 0
      }
    })

    // Skylights
    if (hasSkylights && settings.skylight_flat_fee) {
      price += settings.skylight_flat_fee
    }

    // Additional services
    additionalServices.forEach((serviceName) => {
      const service = services.find((s) => s.name === serviceName)
      if (service) {
        price += service.flat_fee || 0
      }
    })

    // Post-construction markup
    if (addons.includes("post-construction") && settings.post_construction_markup_percentage) {
      price *= 1 + settings.post_construction_markup_percentage / 100
    }

    // Apply discount
    if (settings.discount_enabled) {
      if (settings.discount_type === "percentage") {
        price *= 1 - (settings.discount_percentage || 0) / 100
      } else if (settings.discount_type === "flat_amount") {
        price = Math.max(0, price - (settings.discount_amount || 0))
      }
    }

    setFinalPrice(Number(price.toFixed(2)))
  }, [services, squareFootage, stories, serviceType, addons, hasSkylights, additionalServices, settings])

  useEffect(() => {
    calculatePrice()
  }, [calculatePrice])

  // Get service options
  const windowCleaningServices = services.filter((s) => s.category === "main" && s.is_active)
  const windowCleaningAddons = services.filter((s) => s.category === "addon" && s.is_active)
  const additionalWindowServices = services.filter((s) => s.category === "additional" && s.is_active)

  // Helper function to calculate individual service price
  const calculateServicePrice = (service: Service) => {
    let servicePrice = 0

    if (service.use_both_pricing) {
      servicePrice = squareFootage * (service.per_sqft_price || 0) + (service.flat_fee || 0)
    } else if (service.per_sqft_price) {
      servicePrice = squareFootage * service.per_sqft_price
    } else if (service.flat_fee) {
      servicePrice = service.flat_fee
    }

    // Apply story multiplier
    const storyMultiplier = settings.story_multipliers?.[stories.toString()] || 0
    servicePrice *= 1 + storyMultiplier

    // Apply story flat fee
    const storyFlatFee = settings.story_flat_fees?.[stories.toString()] || 0
    servicePrice += storyFlatFee

    // Apply minimum price
    if (service.minimum_price && servicePrice < service.minimum_price) {
      servicePrice = service.minimum_price
    }

    return servicePrice
  }

  const handleSubmit = () => {
    if (!serviceType) {
      toast({
        title: "Missing Information",
        description: "Please select a window cleaning service type.",
        variant: "destructive",
      })
      return
    }

    const quoteData = {
      ...customerData,
      customer_type: "residential",
      service_type: serviceType,
      square_footage: squareFootage,
      stories,
      addons,
      has_skylights: hasSkylights,
      additional_services: additionalServices,
      final_price: finalPrice,
      quote_data: {
        serviceType,
        addons,
        hasSkylights,
        additionalServices,
        squareFootage,
        stories,
      },
    }

    onSubmit(quoteData)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900">Window Cleaning Quote</CardTitle>
          <p className="text-lg text-gray-600 mt-2">Configure your window cleaning service</p>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Property Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Property Details</Label>
              <div className="space-y-2">
                <Label>Square Footage: {squareFootage > 0 ? `${squareFootage} sq ft` : "Estimating..."}</Label>
              </div>
              <div className="space-y-3">
                <Label>Number of Stories *</Label>
                <RadioGroup value={stories.toString()} onValueChange={(value) => setStories(Number(value))}>
                  {[1, 2, 3, 4].map((story) => (
                    <div key={story} className="flex items-center space-x-2">
                      <RadioGroupItem value={story.toString()} id={`story-${story}`} />
                      <Label htmlFor={`story-${story}`}>
                        {story} {story === 1 ? "Story" : "Stories"}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold">Service Type *</Label>
              <RadioGroup value={serviceType} onValueChange={setServiceType}>
                {windowCleaningServices.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={service.name} id={service.name} />
                      <Label htmlFor={service.name} className="font-medium">
                        {service.display_name || service.name}
                      </Label>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">${calculateServicePrice(service).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          {/* Add-ons */}
          {windowCleaningAddons.length > 0 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Add-ons</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {windowCleaningAddons.map((addon) => (
                  <div key={addon.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={addon.name}
                        checked={addons.includes(addon.name)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setAddons([...addons, addon.name])
                          } else {
                            setAddons(addons.filter((a) => a !== addon.name))
                          }
                        }}
                      />
                      <Label htmlFor={addon.name} className="font-medium">
                        {addon.display_name || addon.name}
                      </Label>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">+${(addon.flat_fee || 0).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skylights */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Checkbox id="skylights" checked={hasSkylights} onCheckedChange={setHasSkylights} />
                <Label htmlFor="skylights" className="font-medium">
                  Property has skylights
                </Label>
              </div>
              <div className="text-right">
                <div className="font-semibold text-green-600">+${(settings.skylight_flat_fee || 0).toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Additional Services */}
          {additionalWindowServices.length > 0 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Additional Services</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {additionalWindowServices.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={service.name}
                        checked={additionalServices.includes(service.name)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setAdditionalServices([...additionalServices, service.name])
                          } else {
                            setAdditionalServices(additionalServices.filter((s) => s !== service.name))
                          }
                        }}
                      />
                      <Label htmlFor={service.name} className="font-medium">
                        {service.display_name || service.name}
                      </Label>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">+${(service.flat_fee || 0).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total Price */}
          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex justify-between items-center">
              <Label className="text-2xl font-bold">Total Estimated Price:</Label>
              <div className="text-3xl font-bold text-green-600">${finalPrice.toFixed(2)}</div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button onClick={onBack} variant="outline">
              Back
            </Button>
            <Button onClick={handleSubmit}>Get Quote</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
