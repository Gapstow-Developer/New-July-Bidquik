"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/types/supabase"

type Service = Database["public"]["Tables"]["services"]["Row"]
type Settings = Database["public"]["Tables"]["settings"]["Row"]

interface ResidentialPressureCalculatorProps {
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

export function ResidentialPressureCalculator({
  customerData,
  settings,
  onBack,
  onSubmit,
}: ResidentialPressureCalculatorProps) {
  const { toast } = useToast()
  const [services, setServices] = useState<Service[]>([])
  const [squareFootage, setSquareFootage] = useState<number>(0)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
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

    selectedServices.forEach((serviceName) => {
      const service = services.find((s) => s.name === serviceName && s.category === "pressure-washing")
      if (service) {
        let servicePrice = 0

        if (service.use_both_pricing) {
          servicePrice = squareFootage * (service.per_sqft_price || 0) + (service.flat_fee || 0)
        } else if (service.per_sqft_price) {
          servicePrice = squareFootage * service.per_sqft_price
        } else if (service.flat_fee) {
          servicePrice = service.flat_fee
        }

        // Apply minimum price
        if (service.minimum_price && servicePrice < service.minimum_price) {
          servicePrice = service.minimum_price
        }

        price += servicePrice
      }
    })

    // Apply discount
    if (settings.discount_enabled) {
      if (settings.discount_type === "percentage") {
        price *= 1 - (settings.discount_percentage || 0) / 100
      } else if (settings.discount_type === "flat_amount") {
        price = Math.max(0, price - (settings.discount_amount || 0))
      }
    }

    setFinalPrice(Number(price.toFixed(2)))
  }, [services, squareFootage, selectedServices, settings])

  useEffect(() => {
    calculatePrice()
  }, [calculatePrice])

  // Get pressure washing services
  const pressureWashingServices = services.filter((s) => s.category === "pressure-washing" && s.is_active)

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

    // Apply minimum price
    if (service.minimum_price && servicePrice < service.minimum_price) {
      servicePrice = service.minimum_price
    }

    return servicePrice
  }

  const handleSubmit = () => {
    if (selectedServices.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select at least one pressure washing service.",
        variant: "destructive",
      })
      return
    }

    const quoteData = {
      ...customerData,
      customer_type: "residential",
      service_type: "pressure-washing",
      square_footage: squareFootage,
      selected_pressure_washing_services: selectedServices,
      final_price: finalPrice,
      quote_data: {
        selectedServices,
        squareFootage,
      },
    }

    onSubmit(quoteData)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900">Pressure Washing Quote</CardTitle>
          <p className="text-lg text-gray-600 mt-2">Select your exterior cleaning services</p>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Property Details */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Property Details</Label>
            <div className="space-y-2">
              <Label>Square Footage: {squareFootage > 0 ? `${squareFootage} sq ft` : "Estimating..."}</Label>
            </div>
          </div>

          {/* Pressure Washing Services */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Select Services *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pressureWashingServices.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={service.name}
                      checked={selectedServices.includes(service.name)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedServices([...selectedServices, service.name])
                        } else {
                          setSelectedServices(selectedServices.filter((s) => s !== service.name))
                        }
                      }}
                    />
                    <div>
                      <Label htmlFor={service.name} className="font-medium text-base">
                        {service.display_name || service.name}
                      </Label>
                      {service.description && <p className="text-sm text-gray-600 mt-1">{service.description}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600 text-lg">
                      ${calculateServicePrice(service).toFixed(2)}
                    </div>
                    {service.per_sqft_price && (
                      <div className="text-xs text-gray-500">${service.per_sqft_price}/sq ft</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

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
