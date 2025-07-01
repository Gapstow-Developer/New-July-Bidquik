"use client"

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import type { AddressDetails } from "@/app/types"

interface CommercialInquiryFormProps {
  onBack: () => void
  settings: any // Pass settings for dynamic title/subtitle/logo
  initialName?: string // New prop
  initialEmail?: string // New prop
  initialPhone?: string // New prop
  initialAddress?: string // New prop for pre-filling address
  initialAddressDetails?: AddressDetails | null // New prop for pre-filling address details
}

export function CommercialInquiryForm({
  onBack,
  settings,
  initialName = "",
  initialEmail = "",
  initialPhone = "",
  initialAddress = "",
  initialAddressDetails = null,
}: CommercialInquiryFormProps) {
  const { toast } = useToast()

  const [businessName, setBusinessName] = useState("")
  const [contactName, setContactName] = useState(initialName)
  const [contactEmail, setContactEmail] = useState(initialEmail)
  const [contactPhone, setContactPhone] = useState(initialPhone)
  const [propertyAddress, setPropertyAddress] = useState(initialAddress)
  const [propertyAddressDetails, setPropertyAddressDetails] = useState<AddressDetails | null>(initialAddressDetails)
  const [buildingType, setBuildingType] = useState("")
  const [numStories, setNumStories] = useState("")
  const [approxNumWindows, setApproxNumWindows] = useState("")
  const [serviceFrequency, setServiceFrequency] = useState("")
  const [accessNotes, setAccessNotes] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
        .filter((file) => file.type.startsWith("image/"))
        .slice(0, 4 - selectedFiles.length)

      setSelectedFiles((prevFiles) => {
        const newFiles = [...prevFiles, ...filesArray]
        return newFiles.slice(0, 4)
      })
    }
  }

  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    // Removed client-side validation for debugging purposes
    // if (
    //   !businessName ||
    //   !contactName ||
    //   !contactEmail ||
    //   !contactPhone ||
    //   !propertyAddressDetails ||
    //   !buildingType ||
    //   !numStories ||
    //   !approxNumWindows ||
    //   !serviceFrequency
    // ) {
    //   setError("Please fill in all required fields.")
    //   setIsLoading(false)
    //   return
    // }

    const formData = new FormData()
    formData.append("businessName", businessName)
    formData.append("contactName", contactName)
    formData.append("contactEmail", contactEmail)
    formData.append("contactPhone", contactPhone)
    formData.append("propertyAddress", propertyAddress)
    // Ensure propertyAddressDetails is stringified, even if null/empty
    formData.append("propertyAddressDetails", JSON.stringify(propertyAddressDetails))
    formData.append("buildingType", buildingType)
    formData.append("numStories", numStories)
    formData.append("approxNumWindows", approxNumWindows)
    formData.append("serviceFrequency", serviceFrequency)
    formData.append("accessNotes", accessNotes)

    selectedFiles.forEach((file) => {
      formData.append("images", file)
    })

    try {
      const response = await fetch("/api/submit-commercial-inquiry", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to submit commercial inquiry.")
      }

      setIsSubmitted(true)
      toast({
        title: "Inquiry Submitted!",
        description: "Thank you! We've received your commercial inquiry and will contact you shortly.",
      })
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.")
      toast({
        title: "Error",
        description: err.message || "Failed to submit inquiry.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-8 flex items-center justify-center">
      <Card className="w-full max-w-2xl shadow-2xl overflow-hidden">
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
        <CardContent className="p-6 sm:p-8 space-y-6 bg-white">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold text-black text-center">Commercial Inquiry Form</h2>
              <p className="text-slate-600 text-center">
                Please provide details about your commercial property for a custom quote.
              </p>

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    type="text"
                    placeholder="e.g., Acme Corp"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contactName">Contact Person Name</Label>
                  <Input
                    id="contactName"
                    type="text"
                    placeholder="e.g., Jane Doe"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="e.g., jane@example.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    placeholder="e.g., (555) 123-4567"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>
              </div>

              <AddressAutocomplete
                label="Property Address"
                initialAddress={propertyAddress}
                onAddressChange={setPropertyAddress}
                onAddressDetailsChange={setPropertyAddressDetails}
                // Removed required prop
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="buildingType">Building Type</Label>
                  <Select value={buildingType} onValueChange={setBuildingType}>
                    <SelectTrigger id="buildingType">
                      <SelectValue placeholder="Select building type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="office">Office Building</SelectItem>
                      <SelectItem value="retail">Retail Store</SelectItem>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                      <SelectItem value="multi-family">Multi-Family Residential (Large Scale)</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="numStories">Number of Stories</Label>
                  <Select value={numStories} onValueChange={setNumStories}>
                    <SelectTrigger id="numStories">
                      <SelectValue placeholder="Select number of stories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Story</SelectItem>
                      <SelectItem value="2">2 Stories</SelectItem>
                      <SelectItem value="3">3 Stories</SelectItem>
                      <SelectItem value="4">4 Stories</SelectItem>
                      <SelectItem value="5">5 Stories</SelectItem>
                      <SelectItem value="6-10">6-10 Stories</SelectItem>
                      <SelectItem value="10+">10+ Stories</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="approxNumWindows">Approx. Number of Windows/Panes</Label>
                  <Select value={approxNumWindows} onValueChange={setApproxNumWindows}>
                    <SelectTrigger id="approxNumWindows">
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2-5">2-5</SelectItem>
                      <SelectItem value="5-10">5-10</SelectItem>
                      <SelectItem value="10-30">10-30</SelectItem>
                      <SelectItem value="31-100">31-100</SelectItem>
                      <SelectItem value="101-200">101-200</SelectItem>
                      <SelectItem value="201-500">201-500</SelectItem>
                      <SelectItem value="500+">500+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="serviceFrequency">Desired Service Frequency</Label>
                  <Select value={serviceFrequency} onValueChange={setServiceFrequency}>
                    <SelectTrigger id="serviceFrequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                      <SelectItem value="every-4-weeks">Every 4 Weeks</SelectItem>
                      <SelectItem value="every-8-weeks">Every 8 Weeks</SelectItem>
                      <SelectItem value="every-12-weeks">Every 12 Weeks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="propertyImages">Property Images (Optional, up to 4)</Label>
                <Input
                  id="propertyImages"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="col-span-full"
                  disabled={selectedFiles.length >= 4}
                />
                {selectedFiles.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file) || "/placeholder.svg"}
                          alt={`Property image ${index + 1}`}
                          crossOrigin="anonymous"
                          className="w-full h-24 object-cover rounded-md"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveFile(index)}
                          aria-label={`Remove image ${index + 1}`}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="accessNotes">Specific Access Requirements / Notes (Optional)</Label>
                <Textarea
                  id="accessNotes"
                  placeholder="e.g., Requires boom lift, after-hours access only, specific safety protocols."
                  value={accessNotes}
                  onChange={(e) => setAccessNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
                  Go Back
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Inquiry"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-6 py-12">
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-black">Inquiry Submitted Successfully!</h2>
              <p className="text-slate-600">
                Thank you for your commercial inquiry. Our team will review your details and contact you shortly to
                discuss a custom quote.
              </p>
              <Button onClick={onBack}>Return to Start</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
