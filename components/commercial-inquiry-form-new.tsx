"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"

interface CommercialInquiryFormNewProps {
  customerData: {
    name: string
    email: string
    phone: string
    address: string
    addressDetails: any
  }
  onBack: () => void
  onSubmit: (data: any) => void
}

export function CommercialInquiryFormNew({ customerData, onBack, onSubmit }: CommercialInquiryFormNewProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    companyName: "",
    jobTitle: "",
    propertyType: "",
    buildingSize: "",
    numberOfBuildings: "1",
    servicesNeeded: [] as string[],
    frequency: "",
    timeline: "",
    budget: "",
    specialRequirements: "",
    accessRequirements: "",
    preferredContactMethod: "email",
    bestTimeToContact: "",
    additionalNotes: "",
  })

  const handleServiceChange = (service: string, checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        servicesNeeded: [...prev.servicesNeeded, service],
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        servicesNeeded: prev.servicesNeeded.filter((s) => s !== service),
      }))
    }
  }

  const handleSubmit = async () => {
    if (!formData.companyName || !formData.propertyType || formData.servicesNeeded.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const submitData = {
      ...customerData,
      ...formData,
      customer_type: "commercial",
    }

    try {
      const response = await fetch("/api/submit-commercial-inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Inquiry Submitted",
          description: "We'll contact you within 24 hours with a custom quote.",
        })
        onSubmit(submitData)
      } else {
        throw new Error(result.message || "Failed to submit inquiry")
      }
    } catch (error: any) {
      toast({
        title: "Submission Error",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900">Commercial Service Inquiry</CardTitle>
          <p className="text-lg text-gray-600 mt-2">Tell us about your commercial cleaning needs</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company Information */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Company Information</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, companyName: e.target.value }))}
                  placeholder="Enter company name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Your Job Title</Label>
                <Input
                  id="jobTitle"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData((prev) => ({ ...prev, jobTitle: e.target.value }))}
                  placeholder="e.g., Facility Manager, Owner"
                />
              </div>
            </div>
          </div>

          {/* Property Information */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Property Information</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label>Property Type *</Label>
                <RadioGroup
                  value={formData.propertyType}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, propertyType: value }))}
                >
                  {[
                    "Office Building",
                    "Retail Store",
                    "Restaurant",
                    "Medical Facility",
                    "Industrial/Warehouse",
                    "Multi-family Residential",
                    "Other",
                  ].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <RadioGroupItem value={type} id={type} />
                      <Label htmlFor={type}>{type}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="buildingSize">Building Size (sq ft)</Label>
                  <Input
                    id="buildingSize"
                    value={formData.buildingSize}
                    onChange={(e) => setFormData((prev) => ({ ...prev, buildingSize: e.target.value }))}
                    placeholder="e.g., 10,000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numberOfBuildings">Number of Buildings</Label>
                  <Input
                    id="numberOfBuildings"
                    type="number"
                    value={formData.numberOfBuildings}
                    onChange={(e) => setFormData((prev) => ({ ...prev, numberOfBuildings: e.target.value }))}
                    min="1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Services Needed */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Services Needed *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Window Cleaning (Interior)",
                "Window Cleaning (Exterior)",
                "Pressure Washing",
                "Building Exterior Cleaning",
                "Sidewalk/Walkway Cleaning",
                "Parking Lot Cleaning",
                "Gutter Cleaning",
                "Solar Panel Cleaning",
                "Post-Construction Cleanup",
                "Other (specify in notes)",
              ].map((service) => (
                <div key={service} className="flex items-center space-x-2">
                  <Checkbox
                    id={service}
                    checked={formData.servicesNeeded.includes(service)}
                    onCheckedChange={(checked) => handleServiceChange(service, checked as boolean)}
                  />
                  <Label htmlFor={service}>{service}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Service Details */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Service Details</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label>Service Frequency</Label>
                <RadioGroup
                  value={formData.frequency}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, frequency: value }))}
                >
                  {["One-time service", "Weekly", "Bi-weekly", "Monthly", "Quarterly", "Bi-annually", "Annually"].map(
                    (freq) => (
                      <div key={freq} className="flex items-center space-x-2">
                        <RadioGroupItem value={freq} id={freq} />
                        <Label htmlFor={freq}>{freq}</Label>
                      </div>
                    ),
                  )}
                </RadioGroup>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="timeline">Desired Timeline</Label>
                  <Input
                    id="timeline"
                    value={formData.timeline}
                    onChange={(e) => setFormData((prev) => ({ ...prev, timeline: e.target.value }))}
                    placeholder="e.g., Within 2 weeks, ASAP"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget Range (optional)</Label>
                  <Input
                    id="budget"
                    value={formData.budget}
                    onChange={(e) => setFormData((prev) => ({ ...prev, budget: e.target.value }))}
                    placeholder="e.g., $500-1000/month"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Special Requirements */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="specialRequirements">Special Requirements</Label>
              <Textarea
                id="specialRequirements"
                value={formData.specialRequirements}
                onChange={(e) => setFormData((prev) => ({ ...prev, specialRequirements: e.target.value }))}
                placeholder="e.g., High windows, security requirements, specific cleaning products"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessRequirements">Access Requirements</Label>
              <Textarea
                id="accessRequirements"
                value={formData.accessRequirements}
                onChange={(e) => setFormData((prev) => ({ ...prev, accessRequirements: e.target.value }))}
                placeholder="e.g., Key card access, security escort needed, specific hours"
                rows={3}
              />
            </div>
          </div>

          {/* Contact Preferences */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Contact Preferences</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label>Preferred Contact Method</Label>
                <RadioGroup
                  value={formData.preferredContactMethod}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, preferredContactMethod: value }))}
                >
                  {[
                    { value: "email", label: "Email" },
                    { value: "phone", label: "Phone Call" },
                    { value: "text", label: "Text Message" },
                    { value: "any", label: "Any method" },
                  ].map((method) => (
                    <div key={method.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={method.value} id={method.value} />
                      <Label htmlFor={method.value}>{method.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bestTimeToContact">Best Time to Contact</Label>
                <Input
                  id="bestTimeToContact"
                  value={formData.bestTimeToContact}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bestTimeToContact: e.target.value }))}
                  placeholder="e.g., Weekdays 9-5, Mornings only"
                />
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Additional Notes</Label>
            <Textarea
              id="additionalNotes"
              value={formData.additionalNotes}
              onChange={(e) => setFormData((prev) => ({ ...prev, additionalNotes: e.target.value }))}
              placeholder="Any additional information that would help us provide an accurate quote"
              rows={4}
            />
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button onClick={onBack} variant="outline">
              Back
            </Button>
            <Button onClick={handleSubmit}>Submit Inquiry</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
