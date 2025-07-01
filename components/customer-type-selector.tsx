"use client"

import { useState, useEffect } from "react" // Import useEffect
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import type { AddressDetails } from "@/app/types"
import type { Database } from "@/types/supabase"
import { useToast } from "@/hooks/use-toast"

type Settings = Database["public"]["Tables"]["settings"]["Row"] & {
  form_type?: string | null
  pressure_washing_enabled?: boolean | null // Add this to settings type
}

interface CustomerTypeSelectorProps {
  onSelect: (
    type: "residential" | "commercial",
    name: string,
    email: string,
    phone: string,
    address: string,
    addressDetails: AddressDetails | null,
    selectedServices: string[], // New prop for selected services
  ) => void
  settings: Settings
  showResidentialOnly?: boolean
  showCommercialOnly?: boolean
}

export function CustomerTypeSelector({
  onSelect,
  settings,
  showResidentialOnly = false,
  showCommercialOnly = false,
}: CustomerTypeSelectorProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [addressDetails, setAddressDetails] = useState<AddressDetails | null>(null)
  const [selectedServices, setSelectedServices] = useState<string[]>([]) // State for service checkboxes

  const { toast } = useToast()

  const handleAddressChange = (fullAddress: string, details: AddressDetails | null) => {
    console.log("AddressAutocomplete changed:", { fullAddress, details }) // Debug log
    setAddress(fullAddress)
    setAddressDetails(details)
  }

  const handleServiceToggle = (service: string) => {
    setSelectedServices((prev) => (prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]))
  }

  const isFormValid = name && email && address && selectedServices.length > 0

  // Debug log for form validity
  useEffect(() => {
    console.log("Form State Update:")
    console.log("  Name:", name)
    console.log("  Email:", email)
    console.log("  Address:", address)
    console.log("  Selected Services:", selectedServices)
    console.log("  isFormValid:", isFormValid)
  }, [name, email, address, selectedServices, isFormValid])

  const formType = settings?.form_type || "both"

  const showResidentialButton = !showCommercialOnly && (formType === "both" || formType === "residential")
  const showCommercialButton = !showResidentialOnly && (formType === "both" || formType === "commercial")

  const handleButtonClick = (type: "residential" | "commercial") => {
    if (!name) {
      toast({
        title: "Missing Information",
        description: "Please enter your name.",
        variant: "destructive",
      })
      return
    }
    if (!email) {
      toast({
        title: "Missing Information",
        description: "Please enter your email address.",
        variant: "destructive",
      })
      return
    }
    if (!address) {
      toast({
        title: "Missing Information",
        description: "Please enter your property address.",
        variant: "destructive",
      })
      return
    }
    if (selectedServices.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select at least one service you are interested in.",
        variant: "destructive",
      })
      return
    }
    onSelect(type, name, email, phone, address, addressDetails, selectedServices)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{settings?.form_title || "Get an Instant Quote"}</CardTitle>
        <CardDescription>{settings?.form_subtitle || "Select your service type to begin."}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Your Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone (Optional)</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
        </div>
        <div className="grid gap-2">
          <AddressAutocomplete onAddressSelect={handleAddressChange} initialAddress={address} />
        </div>

        <div className="space-y-2">
          <Label>What services are you interested in?</Label>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="service-window-cleaning"
                checked={selectedServices.includes("window-cleaning")}
                onCheckedChange={() => handleServiceToggle("window-cleaning")}
              />
              <Label htmlFor="service-window-cleaning">Window Cleaning</Label>
            </div>
            {settings.pressure_washing_enabled && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="service-exterior-cleaning"
                  checked={selectedServices.includes("exterior-cleaning")}
                  onCheckedChange={() => handleServiceToggle("exterior-cleaning")}
                />
                <Label htmlFor="service-exterior-cleaning">Exterior Cleaning (Pressure Washing)</Label>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {showResidentialButton && (
          <Button className="w-full" onClick={() => handleButtonClick("residential")} disabled={!isFormValid}>
            Get Residential Quote
          </Button>
        )}
        {showCommercialButton && (
          <Button
            className="w-full"
            variant="outline"
            onClick={() => handleButtonClick("commercial")}
            disabled={!isFormValid}
          >
            Commercial Inquiry
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
