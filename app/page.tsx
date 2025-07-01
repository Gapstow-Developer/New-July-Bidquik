"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import type { AddressDetails } from "@/app/types"
import type { Database } from "@/types/supabase"

type Settings = Database["public"]["Tables"]["settings"]["Row"]
type Service = Database["public"]["Tables"]["services"]["Row"]

export default function Home() {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState<"customer-type" | "service-selection" | "calculator">("customer-type")
  const [customerType, setCustomerType] = useState<"residential" | "commercial" | null>(null)
  const [serviceType, setServiceType] = useState<"window-cleaning" | "pressure-washing" | "both" | null>(null)
  const [customerData, setCustomerData] = useState<{
    name: string
    email: string
    phone: string
    address: string
    addressDetails: AddressDetails | null
  } | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [currentCalculatorStep, setCurrentCalculatorStep] = useState<"window" | "pressure">("window")

  // Form data for service selection step
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [addressDetails, setAddressDetails] = useState<AddressDetails | null>(null)

  // Calculator state
  const [squareFootage, setSquareFootage] = useState<number>(0)
  const [stories, setStories] = useState<number>(1)
  const [windowServiceType, setWindowServiceType] = useState<string>("")
  const [windowAddons, setWindowAddons] = useState<string[]>([])
  const [hasSkylights, setHasSkylights] = useState(false)
  const [additionalServices, setAdditionalServices] = useState<string[]>([])
  const [selectedPressureServices, setSelectedPressureServices] = useState<string[]>([])
  const [finalPrice, setFinalPrice] = useState<number>(0)

  // Commercial form state
  const [commercialData, setCommercialData] = useState({
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

  // Fetch settings and services
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsResponse, servicesResponse] = await Promise.all([
          fetch("/api/settings", { cache: "no-store" }),
          fetch("/api/services"),
        ])

        if (!settingsResponse.ok) throw new Error("Failed to fetch settings")
        if (!servicesResponse.ok) throw new Error("Failed to fetch services")

        const settingsData = await settingsResponse.json()
        const servicesData = await servicesResponse.json()

        if (settingsData.success) {
          setSettings(settingsData.data)
        }
        if (servicesData.success) {
          setServices(servicesData.data)
        }
      } catch (error: any) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error loading data",
          description: error.message || "Please try refreshing the page.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingSettings(false)
      }
    }
    fetchData()
  }, [toast])

  useEffect(() => {
    if (services.length > 0) {
      console.log("🔍 All services fetched:", services)
      console.log(
        "🪟 Window cleaning services:",
        services.filter((s) => s.category === "window-cleaning"),
      )
      console.log(
        "➕ Window cleaning addons:",
        services.filter((s) => s.category === "window-cleaning-addon"),
      )
      console.log(
        "🏠 Additional window services:",
        services.filter((s) => s.category === "additional-window-service"),
      )
      console.log(
        "🚿 Pressure washing services:",
        services.filter((s) => s.category === "pressure-washing"),
      )
    }
  }, [services])

  // Estimate square footage when address changes
  useEffect(() => {
    const estimateSquareFootage = async () => {
      if (customerData?.addressDetails?.lat && customerData?.addressDetails?.lng) {
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
    if (currentStep === "calculator") {
      estimateSquareFootage()
    }
  }, [customerData, currentStep])

  // Calculate price
  const calculatePrice = useCallback(() => {
    console.log("🧮 Starting price calculation with:", {
      serviceType,
      windowServiceType,
      windowAddons,
      hasSkylights,
      additionalServices,
      selectedPressureServices,
      squareFootage,
      stories,
      servicesCount: services.length,
      settingsAvailable: !!settings,
    })
    if (!settings || services.length === 0) return

    let price = 0

    // Window cleaning calculation
    if ((serviceType === "window-cleaning" || serviceType === "both") && windowServiceType) {
      const service = services.find((s) => s.name === windowServiceType && s.category === "window-cleaning")
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

        // Add-ons
        windowAddons.forEach((addonName) => {
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
        if (windowAddons.includes("post-construction") && settings.post_construction_markup_percentage) {
          price *= 1 + settings.post_construction_markup_percentage / 100
        }
      }
    }

    // Pressure washing calculation
    if ((serviceType === "pressure-washing" || serviceType === "both") && selectedPressureServices.length > 0) {
      selectedPressureServices.forEach((serviceName) => {
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
  }, [
    services,
    squareFootage,
    stories,
    windowServiceType,
    windowAddons,
    hasSkylights,
    additionalServices,
    selectedPressureServices,
    settings,
    serviceType,
  ])

  useEffect(() => {
    calculatePrice()
  }, [calculatePrice])

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
    }
  }

  const handleCustomerTypeSelect = async (type: "residential" | "commercial") => {
    await trackCalculatorStart(type)
    setCustomerType(type)
    setCurrentStep("service-selection")
  }

  const createIncompleteQuote = async () => {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const incompleteQuoteData = {
        session_id: sessionId,
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        address: address,
        customer_type: customerType,
        service_type: serviceType,
        status: "incomplete",
        last_step_completed: 2,
        quote_data: {
          addressDetails: addressDetails,
          selectedServices: serviceType,
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

  const handleServiceSelection = async () => {
    if (!name || !email || !address || !serviceType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select a service type.",
        variant: "destructive",
      })
      return
    }

    await createIncompleteQuote()

    setCustomerData({
      name,
      email,
      phone,
      address,
      addressDetails,
    })
    setCurrentStep("calculator")

    // For residential with both services, start with window cleaning
    if (customerType === "residential" && serviceType === "both") {
      setCurrentCalculatorStep("window")
    }
  }

  const handleAddressSelect = (selectedAddress: string, details: AddressDetails | null) => {
    setAddress(selectedAddress)
    setAddressDetails(details)
  }

  const handleBack = () => {
    if (currentStep === "calculator") {
      if (customerType === "residential" && serviceType === "both" && currentCalculatorStep === "pressure") {
        setCurrentCalculatorStep("window")
        return
      }
      setCurrentStep("service-selection")
    } else if (currentStep === "service-selection") {
      setCurrentStep("customer-type")
      setCustomerType(null)
    }
  }

  const handleQuoteSubmit = async () => {
    if (customerType === "residential") {
      if ((serviceType === "window-cleaning" || serviceType === "both") && !windowServiceType) {
        toast({
          title: "Missing Information",
          description: "Please select a window cleaning service type.",
          variant: "destructive",
        })
        return
      }

      if ((serviceType === "pressure-washing" || serviceType === "both") && selectedPressureServices.length === 0) {
        toast({
          title: "Missing Information",
          description: "Please select at least one pressure washing service.",
          variant: "destructive",
        })
        return
      }
    }

    try {
      const quoteData = {
        ...customerData,
        customer_type: customerType,
        service_type: serviceType,
        square_footage: squareFootage,
        stories,
        final_price: finalPrice,
        quote_data: {
          windowServiceType,
          windowAddons,
          hasSkylights,
          additionalServices,
          selectedPressureServices,
          squareFootage,
          stories,
        },
      }

      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quoteData),
      })

      const result = await response.json()

      if (result.success) {
        // Send confirmation email
        await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "quote_confirmation",
            quoteData: result.data,
          }),
        })

        toast({
          title: "Quote Submitted Successfully!",
          description: "We've sent a confirmation email with your quote details.",
        })

        // Reset form
        setCurrentStep("customer-type")
        setCustomerType(null)
        setServiceType(null)
        setCustomerData(null)
        setCurrentCalculatorStep("window")
        // Reset calculator state
        setWindowServiceType("")
        setWindowAddons([])
        setHasSkylights(false)
        setAdditionalServices([])
        setSelectedPressureServices([])
        setFinalPrice(0)
      } else {
        throw new Error(result.message || "Failed to submit quote")
      }
    } catch (error: any) {
      toast({
        title: "Submission Error",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCommercialSubmit = async () => {
    if (!commercialData.companyName || !commercialData.propertyType || commercialData.servicesNeeded.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      const submitData = {
        ...customerData,
        ...commercialData,
        customer_type: "commercial",
      }

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
          title: "Inquiry Submitted Successfully!",
          description: "We'll contact you within 24 hours with a custom quote.",
        })

        // Reset form
        setCurrentStep("customer-type")
        setCustomerType(null)
        setServiceType(null)
        setCustomerData(null)
        setCommercialData({
          companyName: "",
          jobTitle: "",
          propertyType: "",
          buildingSize: "",
          numberOfBuildings: "1",
          servicesNeeded: [],
          frequency: "",
          timeline: "",
          budget: "",
          specialRequirements: "",
          accessRequirements: "",
          preferredContactMethod: "email",
          bestTimeToContact: "",
          additionalNotes: "",
        })
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

  const handleWindowCalculatorNext = () => {
    if (serviceType === "both") {
      setCurrentCalculatorStep("pressure")
    } else {
      handleQuoteSubmit()
    }
  }

  // Helper function to calculate individual service price
  const calculateServicePrice = (service: Service) => {
    if (!settings) {
      console.log("❌ No settings available for price calculation")
      return 0
    }

    console.log(`💰 Calculating price for service: ${service.name}`, {
      category: service.category,
      per_sqft_price: service.per_sqft_price,
      flat_fee: service.flat_fee,
      use_both_pricing: service.use_both_pricing,
      minimum_price: service.minimum_price,
      squareFootage: squareFootage,
      stories: stories,
    })

    let servicePrice = 0

    if (service.use_both_pricing) {
      servicePrice = squareFootage * (service.per_sqft_price || 0) + (service.flat_fee || 0)
      console.log(
        `📊 Both pricing: (${squareFootage} * ${service.per_sqft_price}) + ${service.flat_fee} = ${servicePrice}`,
      )
    } else if (service.per_sqft_price) {
      servicePrice = squareFootage * service.per_sqft_price
      console.log(`📐 Per sqft pricing: ${squareFootage} * ${service.per_sqft_price} = ${servicePrice}`)
    } else if (service.flat_fee) {
      servicePrice = service.flat_fee
      console.log(`💵 Flat fee pricing: ${service.flat_fee}`)
    }

    if (service.category === "window-cleaning") {
      // Apply story multiplier
      const storyMultiplier = settings.story_multipliers?.[stories.toString()] || 0
      console.log(`🏢 Story multiplier for ${stories} stories: ${storyMultiplier}`)
      servicePrice *= 1 + storyMultiplier

      // Apply story flat fee
      const storyFlatFee = settings.story_flat_fees?.[stories.toString()] || 0
      console.log(`🏢 Story flat fee for ${stories} stories: ${storyFlatFee}`)
      servicePrice += storyFlatFee
    }

    // Apply minimum price
    if (service.minimum_price && servicePrice < service.minimum_price) {
      console.log(`⬆️ Applying minimum price: ${servicePrice} -> ${service.minimum_price}`)
      servicePrice = service.minimum_price
    }

    console.log(`✅ Final calculated price for ${service.name}: $${servicePrice.toFixed(2)}`)
    return servicePrice
  }

  if (isLoadingSettings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-gray-900">
        Loading calculator settings...
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-gray-900">
        Settings not loaded. Please check configuration.
      </div>
    )
  }

  // Step 1: Customer Type Selection
  if (currentStep === "customer-type") {
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
                onClick={() => handleCustomerTypeSelect("residential")}
                variant="outline"
                className="h-32 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 border-2 hover:border-blue-300"
              >
                <div className="text-4xl">🏠</div>
                <div className="text-xl font-semibold">Residential</div>
                <div className="text-sm text-gray-600 text-center">Homeowners & residential properties</div>
              </Button>

              <Button
                onClick={() => handleCustomerTypeSelect("commercial")}
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

  // Step 2: Service Selection
  if (currentStep === "service-selection") {
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
              <Button onClick={handleBack} variant="outline">
                Back
              </Button>
              <Button onClick={handleServiceSelection}>Continue</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 3: Calculator
  if (currentStep === "calculator" && customerData) {
    // Commercial flow
    if (customerType === "commercial") {
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
                      value={commercialData.companyName}
                      onChange={(e) => setCommercialData((prev) => ({ ...prev, companyName: e.target.value }))}
                      placeholder="Enter company name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Your Job Title</Label>
                    <Input
                      id="jobTitle"
                      value={commercialData.jobTitle}
                      onChange={(e) => setCommercialData((prev) => ({ ...prev, jobTitle: e.target.value }))}
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
                      value={commercialData.propertyType}
                      onValueChange={(value) => setCommercialData((prev) => ({ ...prev, propertyType: value }))}
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
                        value={commercialData.buildingSize}
                        onChange={(e) => setCommercialData((prev) => ({ ...prev, buildingSize: e.target.value }))}
                        placeholder="e.g., 10,000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="numberOfBuildings">Number of Buildings</Label>
                      <Input
                        id="numberOfBuildings"
                        type="number"
                        value={commercialData.numberOfBuildings}
                        onChange={(e) => setCommercialData((prev) => ({ ...prev, numberOfBuildings: e.target.value }))}
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
                        checked={commercialData.servicesNeeded.includes(service)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setCommercialData((prev) => ({
                              ...prev,
                              servicesNeeded: [...prev.servicesNeeded, service],
                            }))
                          } else {
                            setCommercialData((prev) => ({
                              ...prev,
                              servicesNeeded: prev.servicesNeeded.filter((s) => s !== service),
                            }))
                          }
                        }}
                      />
                      <Label htmlFor={service}>{service}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="additionalNotes">Additional Notes</Label>
                <Textarea
                  id="additionalNotes"
                  value={commercialData.additionalNotes}
                  onChange={(e) => setCommercialData((prev) => ({ ...prev, additionalNotes: e.target.value }))}
                  placeholder="Any additional information that would help us provide an accurate quote"
                  rows={4}
                />
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-6">
                <Button onClick={handleBack} variant="outline">
                  Back
                </Button>
                <Button onClick={handleCommercialSubmit}>Submit Inquiry</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    // Residential flows
    if (customerType === "residential") {
      // Window cleaning calculator
      if (serviceType === "window-cleaning" || (serviceType === "both" && currentCalculatorStep === "window")) {
        console.log("🪟 Rendering window cleaning calculator")
        console.log("📊 Available services from database:", services)

        // Filter services from database only
        const windowCleaningServices = services.filter((s) => {
          const isMatch = s.category === "window-cleaning" && s.is_active
          console.log(`Service ${s.name}: category=${s.category}, is_active=${s.is_active}, matches=${isMatch}`)
          return isMatch
        })

        const windowCleaningAddons = services.filter((s) => {
          const isMatch = s.category === "window-cleaning-addon" && s.is_active
          console.log(`Addon ${s.name}: category=${s.category}, is_active=${s.is_active}, matches=${isMatch}`)
          return isMatch
        })

        const additionalWindowServices = services.filter((s) => {
          const isMatch = s.category === "additional-window-service" && s.is_active
          console.log(`Additional ${s.name}: category=${s.category}, is_active=${s.is_active}, matches=${isMatch}`)
          return isMatch
        })

        console.log("🎯 Filtered window cleaning services:", windowCleaningServices)
        console.log("🎯 Filtered window cleaning addons:", windowCleaningAddons)
        console.log("🎯 Filtered additional window services:", additionalWindowServices)

        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-5xl">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold text-gray-900">Window Cleaning Quote</CardTitle>
                <p className="text-lg text-gray-600 mt-2">Configure your window cleaning service</p>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Property Details */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

                  <div className="lg:col-span-2 space-y-6">
                    {/* Main Service Type */}
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold">Window Cleaning Service *</Label>
                      {windowCleaningServices.length === 0 ? (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-yellow-800">
                            No window cleaning services found in your database. Please add services with category
                            "window-cleaning" in your dashboard.
                          </p>
                        </div>
                      ) : (
                        <RadioGroup value={windowServiceType} onValueChange={setWindowServiceType}>
                          {windowCleaningServices.map((service) => (
                            <div
                              key={service.id}
                              className="flex items-center justify-between p-4 border-2 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              <div className="flex items-center space-x-3">
                                <RadioGroupItem value={service.name} id={service.name} />
                                <div>
                                  <Label htmlFor={service.name} className="font-semibold text-base cursor-pointer">
                                    {service.display_name || service.name}
                                  </Label>
                                  {service.description && (
                                    <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-green-600 text-lg">
                                  ${calculateServicePrice(service).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                    </div>
                  </div>
                </div>

                {/* Add-ons Section */}
                {windowCleaningAddons.length > 0 && (
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">Add-on Services</Label>
                    <p className="text-sm text-gray-600">Select any additional services you'd like to include</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {windowCleaningAddons.map((addon) => (
                        <div
                          key={addon.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id={addon.name}
                              checked={windowAddons.includes(addon.name)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setWindowAddons([...windowAddons, addon.name])
                                } else {
                                  setWindowAddons(windowAddons.filter((a) => a !== addon.name))
                                }
                              }}
                            />
                            <div>
                              <Label htmlFor={addon.name} className="font-medium cursor-pointer">
                                {addon.display_name || addon.name}
                              </Label>
                              {addon.description && <p className="text-xs text-gray-600 mt-1">{addon.description}</p>}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">+${(addon.flat_fee || 0).toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Property Features */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Property Features</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Skylights */}
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Checkbox id="skylights" checked={hasSkylights} onCheckedChange={setHasSkylights} />
                        <div>
                          <Label htmlFor="skylights" className="font-medium cursor-pointer">
                            Property has skylights
                          </Label>
                          <p className="text-xs text-gray-600 mt-1">Additional cleaning for roof windows</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          +${(settings.skylight_flat_fee || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Post-Construction Markup Info */}
                    {windowAddons.includes("post-construction") && settings.post_construction_markup_percentage && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="text-yellow-600">⚠️</div>
                          <div>
                            <Label className="font-medium text-yellow-800">Post-Construction Notice</Label>
                            <p className="text-xs text-yellow-700 mt-1">
                              Additional {settings.post_construction_markup_percentage}% markup applies for construction
                              site cleaning
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Services */}
                {additionalWindowServices.length > 0 && (
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">Additional Services</Label>
                    <p className="text-sm text-gray-600">Add these services while we're already on-site</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {additionalWindowServices.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
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
                            <div>
                              <Label htmlFor={service.name} className="font-medium cursor-pointer">
                                {service.display_name || service.name}
                              </Label>
                              {service.description && (
                                <p className="text-xs text-gray-600 mt-1">{service.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">+${(service.flat_fee || 0).toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Discount Message */}
                {settings.discount_enabled && settings.discount_message && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="text-green-600">🎉</div>
                      <div>
                        <Label className="font-medium text-green-800">Special Offer</Label>
                        <p className="text-sm text-green-700 mt-1">{settings.discount_message}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Total Price */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border-2 border-green-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <Label className="text-2xl font-bold text-gray-900">Total Estimated Price:</Label>
                      <p className="text-sm text-gray-600 mt-1">Final price may vary based on property condition</p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-green-600">${finalPrice.toFixed(2)}</div>
                      {settings.discount_enabled &&
                        settings.discount_type === "percentage" &&
                        settings.discount_percentage && (
                          <div className="text-sm text-green-600">
                            Includes {settings.discount_percentage}% discount
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-6">
                  <Button onClick={handleBack} variant="outline" size="lg">
                    ← Back
                  </Button>
                  <Button onClick={handleWindowCalculatorNext} size="lg" className="bg-green-600 hover:bg-green-700">
                    {serviceType === "both" ? "Next: Pressure Washing →" : "Get My Quote →"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      }

      // Pressure washing calculator
      if (serviceType === "pressure-washing" || (serviceType === "both" && currentCalculatorStep === "pressure")) {
        // Filter pressure washing services from database
        const pressureWashingServices = services.filter((s) => s.category === "pressure-washing" && s.is_active)

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
                            checked={selectedPressureServices.includes(service.name)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPressureServices([...selectedPressureServices, service.name])
                              } else {
                                setSelectedPressureServices(selectedPressureServices.filter((s) => s !== service.name))
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
                  <Button onClick={handleBack} variant="outline">
                    Back
                  </Button>
                  <Button onClick={handleQuoteSubmit}>Get Quote</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      }
    }
  }

  return null
}
