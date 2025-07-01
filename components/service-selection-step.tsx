"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import type { AddressDetails } from "@/app/types"

interface ServiceSelectionStepProps {
  customerType: "residential" | "commercial"
  onNext: (data: {
    name: string
    email: string
    phone: string
    address: string
    addressDetails: AddressDetails | null
    serviceType: "window-cleaning" | "pressure-washing" | "both"
    sessionId?: string
    incompleteQuoteId?: string
  }) => void
  onBack: () => void
}

export function ServiceSelectionStep({ customerType, onNext, onBack }: ServiceSelectionStepProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [addressDetails, setAddressDetails] = useState<AddressDetails | null>(null)
  const [serviceType, setServiceType] = useState<"window-cleaning" | "pressure-washing" | "both" | null>(null)

  const createIncompleteQuote = async (data: {
    name: string
    email: string
    phone: string
    address: string
    addressDetails: AddressDetails | null
    serviceType: "window-cleaning" | "pressure-washing" | "both"
  }) => {
    try {
      // Generate a simple session ID using timestamp + random
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const incompleteQuoteData = {
        session_id: sessionId,
        customer_name: data.name,
        customer_email: data.email,
        customer_phone: data.phone,
        address: data.address,
        customer_type: customerType,
        service_type: data.serviceType,
        status: "incomplete",
        last_step_completed: 2,
        quote_data: {
          addressDetails: data.addressDetails,
          selectedServices: data.serviceType,
        },
      }

      const response = await fetch("/api/quotes/incomplete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(incompleteQuoteData),
      })

      const result = await response.json()

      if (result.success) {
        console.log("📝 Incomplete quote created:", result.id)
        return { sessionId, incompleteQuoteId: result.id }
      }
    } catch (error) {
      console.error("Failed to create incomplete quote:", error)
    }

    return null
  }

  const handleSubmit = async () => {
    if (!name || !email || !address || !serviceType) {
      alert("Please fill in all required fields and select a service type.")
      return
    }

    const trackingData = await createIncompleteQuote({
      name,
      email,
      phone,
      address,
      addressDetails,
      serviceType,
    })

    onNext({
      name,
      email,
      phone,
      address,
      addressDetails,
      serviceType,
      sessionId: trackingData?.sessionId,
      incompleteQuoteId: trackingData?.incompleteQuoteId,
    })
  }

  const handleAddressSelect = (selectedAddress: string, details: AddressDetails | null) => {
    setAddress(selectedAddress)
    setAddressDetails(details)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900">
            {customerType === "residential" ? "Residential" : "Commercial"} Quote Request
          </CardTitle>
          <p className="text-lg text-gray-600 mt-2">Tell us about yourself and what services you need</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>
            <div className="md:col-span-1">
              <AddressAutocomplete
                initialAddress={address}
                onAddressSelect={handleAddressSelect}
                placeholder="Enter your property address"
                required
              />
            </div>
          </div>

          {/* Service Selection */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">What services do you need? *</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => setServiceType("window-cleaning")}
                variant={serviceType === "window-cleaning" ? "default" : "outline"}
                className="h-24 flex flex-col items-center justify-center space-y-2"
              >
                <div className="text-2xl">🪟</div>
                <div className="font-semibold">Window Cleaning</div>
                <div className="text-xs text-center">Interior & exterior window cleaning</div>
              </Button>

              <Button
                onClick={() => setServiceType("pressure-washing")}
                variant={serviceType === "pressure-washing" ? "default" : "outline"}
                className="h-24 flex flex-col items-center justify-center space-y-2"
              >
                <div className="text-2xl">🚿</div>
                <div className="font-semibold">Pressure Washing</div>
                <div className="text-xs text-center">Exterior cleaning & pressure washing</div>
              </Button>

              <Button
                onClick={() => setServiceType("both")}
                variant={serviceType === "both" ? "default" : "outline"}
                className="h-24 flex flex-col items-center justify-center space-y-2"
              >
                <div className="text-2xl">✨</div>
                <div className="font-semibold">Both Services</div>
                <div className="text-xs text-center">Complete exterior cleaning package</div>
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button onClick={onBack} variant="outline">
              Back
            </Button>
            <Button onClick={handleSubmit}>Continue</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
