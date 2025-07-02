"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import type { AddressDetails } from "@/app/types"
import type { Database } from "@/types/supabase"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

type Settings = Database["public"]["Tables"]["settings"]["Row"]
type Service = Database["public"]["Tables"]["services"]["Row"]

function Calculator() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const orgId = searchParams.get("org")

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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

  useEffect(() => {
    if (!orgId) {
      setError("This calculator is not available. Organization ID is missing.")
      setIsLoading(false)
      return
    }

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [settingsResponse, servicesResponse] = await Promise.all([
          fetch(`/api/settings?org=${orgId}`),
          fetch(`/api/services?org=${orgId}`),
        ])

        if (!settingsResponse.ok) throw new Error("Failed to fetch settings for this organization.")
        if (!servicesResponse.ok) throw new Error("Failed to fetch services for this organization.")

        const settingsData = await settingsResponse.json()
        const servicesData = await servicesResponse.json()

        if (settingsData.success) setSettings(settingsData.data)
        else throw new Error(settingsData.message)

        if (servicesData.success) setServices(servicesData.data)
        else throw new Error(servicesData.message)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [orgId])

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
        organization_id: orgId, // Add orgId to the quote
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
        organization_id: orgId, // Add orgId to the commercial submission
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-4 text-lg">Loading Calculator...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <p className="mt-4 text-sm text-muted-foreground">Please check the URL or contact support.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 1: Customer Type Selection
  if (currentStep === "customer-type") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">
              {settings.form_title || "Get Your Free Quote"}
            </CardTitle>
            <p className="text-lg text-gray-600 mt-2">
              {settings.form_subtitle || "Choose your customer type to get started"}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => {
                  setCustomerType("residential")
                  setCurrentStep("service-selection")
                }}
                variant="outline"
                className="h-32 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 border-2 hover:border-blue-300"
              >
                <div className="text-4xl">🏠</div>
                <div className="text-xl font-semibold">Residential</div>
                <div className="text-sm text-gray-600 text-center">Homeowners & residential properties</div>
              </Button>

              <Button
                onClick={() => {
                  setCustomerType("commercial")
                  setCurrentStep("service-selection")
                }}
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

  // Additional steps would continue here...
  return <div>Calculator steps continue...</div>
}

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Calculator />
    </Suspense>
  )
}
