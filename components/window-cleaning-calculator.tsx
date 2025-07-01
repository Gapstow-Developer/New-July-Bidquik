"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, Loader2, CheckCircle, MapPin, Home, DollarSign, Wrench } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { AddressDetails } from "@/app/types"
import type { Database } from "@/types/supabase"
import { PropertyStreetView } from "@/components/property-street-view"

type Service = Database["public"]["Tables"]["services"]["Row"]
type Settings = Database["public"]["Tables"]["settings"]["Row"] & {
  story_multipliers?: { [key: string]: number }
  story_flat_fees?: { [key: string]: number }
  skylight_flat_fee?: number
  post_construction_markup_percentage?: number
  service_area_enabled?: boolean
  service_area_radius?: number
  business_address_coords?: { lat: number; lng: number }
  discount_enabled?: boolean
  discount_percentage?: number
  discount_type?: string
  discount_amount?: number
  pressure_washing_enabled?: boolean | null
}

interface WindowCleaningCalculatorProps {
  initialName: string
  initialEmail: string
  initialAddress: string
  initialAddressDetails: AddressDetails | null
  customerType: "residential" | "commercial"
  selectedServices: string[]
  settings: Settings
  onBack: () => void
}

export function WindowCleaningCalculator({
  initialName,
  initialEmail,
  initialAddress,
  initialAddressDetails,
  customerType,
  selectedServices,
  settings,
  onBack,
}: WindowCleaningCalculatorProps) {
  const { toast } = useToast()

  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [address, setAddress] = useState(initialAddress)
  const [addressDetails, setAddressDetails] = useState<AddressDetails | null>(initialAddressDetails)
  const [squareFootage, setSquareFootage] = useState<number | null>(null)
  const [stories, setStories] = useState<number | null>(null)
  const [windowServiceType, setWindowServiceType] = useState<string>("exterior-only")
  const [windowAddons, setWindowAddons] = useState<string[]>([])
  const [hasSkylights, setHasSkylights] = useState(false)
  const [additionalWindowServices, setAdditionalWindowServices] = useState<Record<string, boolean>>({})
  const [selectedPressureWashingServices, setSelectedPressureWashingServices] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [finalPrice, setFinalPrice] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quoteId, setQuoteId] = useState<string | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [distance, setDistance] = useState<number | null>(null)

  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false)
  const [quoteSubmitted, setQuoteSubmitted] = useState(false)

  const [isEstimatingSqFt, setIsEstimatingSqFt] = useState(false)
  const [sqFtEstimationError, setSqFtEstimationError] = useState<string | null>(null)

  const showWindowCleaning = selectedServices.includes("window-cleaning")
  const showPressureWashing = selectedServices.includes("exterior-cleaning") && settings.pressure_washing_enabled

  // Define the sequence of steps based on selected services
  const activeSteps = useMemo(() => {
    const steps: ("property-details" | "window-cleaning-details" | "pressure-washing-details" | "quote-review")[] = []
    steps.push("property-details")
    if (showWindowCleaning) {
      steps.push("window-cleaning-details")
    }
    if (showPressureWashing) {
      steps.push("pressure-washing-details")
    }
    steps.push("quote-review")
    return steps
  }, [showWindowCleaning, showPressureWashing])

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const currentStep = activeSteps[currentStepIndex]

  useEffect(() => {
    async function fetchServices() {
      setIsLoading(true)
      setError(null)
      try {
        const servicesRes = await fetch("/api/services")
        const servicesData = await servicesRes.json()

        if (!servicesRes.ok) {
          throw new Error(servicesData.message || "Failed to fetch services")
        }

        setServices(servicesData.data)
      } catch (err: any) {
        setError(err.message || "Failed to load services.")
        toast({
          title: "Error",
          description: err.message || "Failed to load services.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchServices()
  }, [toast])

  useEffect(() => {
    setName(initialName)
    setEmail(initialEmail)
    setAddress(initialAddress)
    setAddressDetails(initialAddressDetails)
  }, [initialName, initialEmail, initialAddress, initialAddressDetails])

  useEffect(() => {
    const estimateSquareFootage = async () => {
      if (!addressDetails || !address) {
        setSquareFootage(null)
        setSqFtEstimationError(null)
        return
      }

      setIsEstimatingSqFt(true)
      setSqFtEstimationError(null)
      setSquareFootage(null)

      try {
        const response = await fetch("/api/get-square-footage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        })
        const result = await response.json()

        if (response.ok && result.success) {
          setSquareFootage(result.data.estimatedSquareFootage)
        } else {
          setSqFtEstimationError(result.error || "Could not automatically estimate property size.")
        }
      } catch (err: any) {
        console.error("Error fetching square footage:", err)
        setSqFtEstimationError("Failed to estimate property size.")
      } finally {
        setIsEstimatingSqFt(false)
      }
    }

    estimateSquareFootage()
  }, [address, addressDetails])

  const calculateSingleServicePrice = useCallback(
    (service: Service, sqFt: number | null, stories: number | null, settings: Settings): number | null => {
      if (sqFt === null || stories === null) return null

      let servicePrice = 0

      if (service.use_both_pricing) {
        servicePrice = sqFt * (service.per_sqft_price || 0) + (service.flat_fee || 0)
      } else if (service.per_sqft_price) {
        servicePrice = sqFt * service.per_sqft_price
      } else if (service.flat_fee) {
        servicePrice = service.flat_fee
      }

      const storyMultiplier = settings?.story_multipliers?.[stories.toString()] || 0
      servicePrice *= 1 + storyMultiplier

      const storyFlatFee = settings?.story_flat_fees?.[stories.toString()] || 0
      servicePrice += storyFlatFee

      if (service.minimum_price && servicePrice < service.minimum_price) {
        servicePrice = service.minimum_price
      }

      return Number.parseFloat(servicePrice.toFixed(2))
    },
    [settings],
  )

  const calculatePrice = useCallback(() => {
    console.log("--- Calculating Price ---")
    console.log("Square Footage:", squareFootage)
    console.log("Stories:", stories)
    console.log("Window Service Type:", windowServiceType)
    console.log("Window Addons:", windowAddons)
    console.log("Has Skylights:", hasSkylights)
    console.log("Additional Window Services (selected):", additionalWindowServices)
    console.log("Selected Pressure Washing Services:", selectedPressureWashingServices)
    console.log("Settings:", settings)
    console.log("Show Window Cleaning:", showWindowCleaning)
    console.log("Show Pressure Washing:", showPressureWashing)
    console.log("Customer Type:", customerType)

    if (!squareFootage || !stories) {
      console.log("Returning null: Missing squareFootage or stories.")
      return null
    }

    let price = 0
    let windowCleaningPrice = 0
    let pressureWashingPrice = 0

    // --- Window Cleaning Calculation ---
    if (showWindowCleaning) {
      const selectedWindowService = services.find((s) => s.name === windowServiceType)
      console.log("Selected Window Service Object:", selectedWindowService)

      if (!selectedWindowService) {
        console.log(
          "Window cleaning selected, but no main service type chosen. Window cleaning price will be 0 for now.",
        )
      } else {
        windowCleaningPrice = calculateSingleServicePrice(selectedWindowService, squareFootage, stories, settings) || 0
        console.log(`Base WC Price (from calculateSingleServicePrice): ${windowCleaningPrice}`)

        if (windowAddons.includes("post-construction")) {
          const postConstructionMarkup = settings?.post_construction_markup_percentage || 0
          windowCleaningPrice *= 1 + postConstructionMarkup / 100
          console.log(`WC Price after Post-Construction Markup (${postConstructionMarkup}%): ${windowCleaningPrice}`)
        }

        if (hasSkylights) {
          windowCleaningPrice += settings?.skylight_flat_fee || 0
          console.log(`WC Price after Skylights ($${settings?.skylight_flat_fee || 0}): ${windowCleaningPrice}`)
        }

        Object.entries(additionalWindowServices).forEach(([serviceName, isSelected]) => {
          if (isSelected) {
            const service = services.find((s) => s.name === serviceName && s.category === "additional")
            if (service?.flat_fee) {
              windowCleaningPrice += service.flat_fee
              console.log(
                `WC Price after Additional Service '${serviceName}' ($${service.flat_fee}): ${windowCleaningPrice}`,
              )
            } else {
              console.log(
                `Additional service '${serviceName}' selected but no flat_fee found or not 'additional' category.`,
              )
            }
          }
        })
      }
      price += windowCleaningPrice
      console.log("Total Price after Window Cleaning:", price)
    }

    // --- Pressure Washing Calculation (Residential Only for now) ---
    if (showPressureWashing && customerType === "residential") {
      selectedPressureWashingServices.forEach((pwServiceName) => {
        const pwService = services.find((s) => s.name === pwServiceName && s.category === "pressure-washing")
        console.log(`PW Service '${pwServiceName}' Object:`, pwService)
        if (pwService) {
          let serviceCost = 0
          if (pwService.use_both_pricing) {
            serviceCost = squareFootage * (pwService.per_sqft_price || 0) + (pwService.flat_fee || 0)
            console.log(`PW Service '${pwServiceName}' Cost (both): ${serviceCost}`)
          } else if (pwService.per_sqft_price) {
            serviceCost = squareFootage * pwService.per_sqft_price
            console.log(`PW Service '${pwServiceName}' Cost (per_sqft): ${serviceCost}`)
          } else if (pwService.flat_fee) {
            serviceCost = pwService.flat_fee
            console.log(`PW Service '${pwServiceName}' Cost (flat_fee): ${serviceCost}`)
          }

          if (pwService.minimum_price && serviceCost < pwService.minimum_price) {
            console.log(
              `PW Service '${pwServiceName}' Cost (${serviceCost}) below minimum ($${pwService.minimum_price}). Setting to minimum.`,
            )
            serviceCost = pwService.minimum_price
          }
          pressureWashingPrice += serviceCost
        }
      })
      price += pressureWashingPrice
      console.log("Total Price after Pressure Washing:", price)
    } else if (showPressureWashing && customerType === "commercial") {
      console.log("Commercial Pressure Washing selected. No price calculation for commercial PW.")
    }

    // Apply overall discount (if enabled and applicable)
    if (settings?.discount_enabled) {
      if (settings.discount_type === "actual") {
        const discountPercentage = settings.discount_percentage || 0
        const originalPrice = price
        price *= 1 - discountPercentage / 100
        console.log(`Price after Percentage Discount (${discountPercentage}%): ${originalPrice} -> ${price}`)
      } else if (settings.discount_type === "flat_amount") {
        const discountAmount = settings.discount_amount || 0
        const originalPrice = price
        price = Math.max(0, price - discountAmount)
        console.log(`Price after Flat Amount Discount ($${discountAmount}): ${originalPrice} -> ${price}`)
      }
    }

    const finalCalculatedPrice = Number.parseFloat(price.toFixed(2))
    console.log("Final Calculated Price (before toFixed(2)):", price)
    console.log("Final Calculated Price (after toFixed(2)):", finalCalculatedPrice)
    console.log("--- End Calculation ---")
    return finalCalculatedPrice
  }, [
    squareFootage,
    stories,
    windowServiceType,
    windowAddons,
    hasSkylights,
    additionalWindowServices,
    selectedPressureWashingServices,
    services,
    settings,
    showWindowCleaning,
    showPressureWashing,
    customerType,
    currentStep,
    calculateSingleServicePrice,
  ])

  useEffect(() => {
    const calculated = calculatePrice()
    setFinalPrice(calculated)
  }, [calculatePrice])

  const handleNext = async () => {
    setError(null)
    setIsLoading(true)

    if (currentStep === "property-details") {
      if (!stories) {
        setError("Please provide the number of stories.")
        setIsLoading(false)
        return
      }
      if (!showWindowCleaning && !showPressureWashing) {
        setError("Please select at least one service (Window Cleaning or Exterior Cleaning).")
        setIsLoading(false)
        return
      }
      if (isEstimatingSqFt) {
        setError("Please wait while we estimate your property details.")
        setIsLoading(false)
        return
      }
      if (!squareFootage && sqFtEstimationError) {
        setError("We could not automatically estimate your property size. Please contact us for a custom quote.")
        setIsLoading(false)
        return
      }

      if (addressDetails && settings?.service_area_enabled && settings?.business_address_coords) {
        try {
          const response = await fetch("/api/calculate-distance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              origin: `${settings.business_address_coords.lat},${settings.business_address_coords.lng}`,
              destination: `${addressDetails.lat},${addressDetails.lng}`,
            }),
          })
          const result = await response.json()
          if (response.ok && result.distance) {
            setDistance(result.distance)
            if (settings.service_area_radius && result.distance > settings.service_area_radius) {
              await fetch("/api/send-outside-area-inquiry", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  customer_name: name,
                  customer_email: email,
                  customer_phone: "",
                  address: address,
                  distance: result.distance,
                }),
              })
              setError(
                "Your address appears to be outside our primary service area. We've received your inquiry and will contact you shortly to discuss options.",
              )
              setIsLoading(false)
              return
            }
          } else {
            console.warn("Could not calculate distance or outside service area:", result.message)
          }
        } catch (distError) {
          console.error("Error calculating distance:", distError)
        }
      }
    } else if (currentStep === "window-cleaning-details") {
      if (showWindowCleaning && !windowServiceType) {
        setError("Please select a window cleaning service type.")
        setIsLoading(false)
        return
      }
    } else if (currentStep === "pressure-washing-details") {
      if (showPressureWashing && customerType === "residential" && selectedPressureWashingServices.length === 0) {
        setError("Please select at least one exterior cleaning service.")
        setIsLoading(false)
        return
      }
    }

    if (currentStepIndex < activeSteps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1)
    } else {
      const price = calculatePrice()
      if (price === null) {
        setError(
          "We could not calculate a price for your property. Please ensure all details are selected or contact us for a custom quote.",
        )
        setIsLoading(false)
        return
      }
      setFinalPrice(price)
    }
    setIsLoading(false)
  }

  const handleSubmitQuote = async () => {
    setIsSubmittingQuote(true)
    setError(null)

    try {
      const quoteData = {
        customer_name: name,
        customer_email: email,
        address: address,
        square_footage: squareFootage,
        stories: stories,
        service_type: windowServiceType,
        addons: windowAddons,
        has_skylights: hasSkylights,
        additional_services: additionalWindowServices,
        pressure_washing_services: selectedPressureWashingServices,
        final_price: finalPrice,
        status: "submitted",
        last_step_completed: 4,
        notes: notes,
        existing_quote_id: quoteId,
        distance: distance,
        customer_type: customerType,
      }

      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quoteData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Failed to submit quote")
      }

      setQuoteId(result.id)
      setQuoteSubmitted(true)

      toast({
        title: "Quote Submitted!",
        description: "Your quote has been successfully submitted. We'll be in touch soon!",
      })

      const emailData: Record<string, any> = {
        customerName: name,
        businessName: settings?.business_name || "Our Company",
        quotePrice: finalPrice,
        address: address,
        squareFootage: squareFootage,
        stories: stories,
        notes: notes,
        businessEmail: settings?.business_email,
        businessPhone: settings?.business_phone,
        businessAddress: settings?.business_address,
        primaryColor: settings?.primary_color,
        secondaryColor: settings?.secondary_color,
      }

      if (showWindowCleaning) {
        emailData.serviceType = services.find((s) => s.name === windowServiceType)?.display_name || windowServiceType
        emailData.addons = windowAddons.map((addon) => services.find((s) => s.name === addon)?.display_name || addon)
        emailData.hasSkylights = hasSkylights
        emailData.additionalServices = Object.keys(additionalWindowServices)
          .filter((key) => additionalWindowServices[key])
          .map((key) => services.find((s) => s.name === key)?.display_name || key)
      }

      if (showPressureWashing) {
        emailData.pressureWashingServices = selectedPressureWashingServices.map(
          (pwService) => services.find((svc) => svc.name === pwService)?.display_name || pwService,
        )
      }

      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject: `Your Quote from ${settings?.business_name || "Us"}`,
          template: "customer-quote",
          data: emailData,
        }),
      })

      if (settings?.notification_emails && settings.notification_emails.length > 0) {
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: settings.notification_emails,
            subject: `New Quote Submitted: ${name} - $${finalPrice}`,
            template: "business-notification",
            data: {
              ...emailData,
              customerEmail: email,
              customerPhone: "",
              finalPrice: finalPrice,
              quoteId: result.id,
              customerType: customerType,
            },
          }),
        })
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit quote. Please try again.")
      toast({
        title: "Error",
        description: err.message || "Failed to submit quote.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingQuote(false)
    }
  }

  const handleBack = () => {
    setError(null)
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1)
    } else {
      onBack()
    }
  }

  const handleWindowServiceTypeChange = (value: string) => {
    setWindowServiceType(value)
    setWindowAddons([])
    setHasSkylights(false)
    setAdditionalWindowServices({})
  }

  const handleWindowAddonChange = (addonName: string, isChecked: boolean) => {
    setWindowAddons((prev) => (isChecked ? [...prev, addonName] : prev.filter((name) => name !== addonName)))
  }

  const handleAdditionalWindowServiceChange = (serviceName: string, isChecked: boolean) => {
    setAdditionalWindowServices((prev) => ({
      ...prev,
      [serviceName]: isChecked,
    }))
  }

  const handlePressureWashingServiceChange = (serviceName: string, isChecked: boolean) => {
    setSelectedPressureWashingServices((prev) =>
      isChecked ? [...prev, serviceName] : prev.filter((name) => name !== serviceName),
    )
  }

  const windowServiceOptions = useMemo(() => {
    return services.filter((s) => s.category === "main" && s.is_active)
  }, [services])

  const windowAddonOptions = useMemo(() => {
    return services.filter((s) => s.category === "addon" && s.is_active)
  }, [services])

  const additionalWindowServiceOptions = useMemo(() => {
    return services.filter((s) => s.category === "additional" && s.is_active)
  }, [services])

  const residentialPressureWashingOptions = useMemo(() => {
    const options = services.filter((s) => s.category === "pressure-washing" && s.is_active)
    console.log("Residential Pressure Washing Options (Memo):", options) // Debug log
    return options
  }, [services])

  const commercialPressureWashingOptions = useMemo(() => {
    const options = services.filter((s) => s.category === "commercial-pressure-washing" && s.is_active)
    console.log("Commercial Pressure Washing Options (Memo):", options) // Debug log
    return options
  }, [services])

  const renderStepContent = () => {
    switch (currentStep) {
      case "property-details":
        return (
          <>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
              <CardDescription>Tell us more about your property.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {addressDetails && (
                <PropertyStreetView latitude={addressDetails.lat} longitude={addressDetails.lng} address={address} />
              )}
              <div className="grid gap-2">
                <Label htmlFor="stories">Number of Stories</Label>
                <Select
                  value={stories?.toString() || ""}
                  onValueChange={(value) => setStories(Number.parseInt(value) || null)}
                >
                  <SelectTrigger id="stories">
                    <SelectValue placeholder="Select number of stories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Story</SelectItem>
                    <SelectItem value="2">2 Stories</SelectItem>
                    <SelectItem value="3">3 Stories</SelectItem>
                    <SelectItem value="4">4+ Stories</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any specific instructions or details about your property?"
                  rows={3}
                />
              </div>
            </CardContent>
          </>
        )
      case "window-cleaning-details":
        return (
          <>
            <CardHeader>
              <CardTitle>Window Cleaning Details</CardTitle>
              <CardDescription>Select your window cleaning preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="windowServiceType">Window Cleaning Service Type</Label>
                <RadioGroup
                  value={windowServiceType}
                  onValueChange={handleWindowServiceTypeChange}
                  className="grid gap-2"
                >
                  {windowServiceOptions.map((service) => {
                    const priceForOption = calculateSingleServicePrice(service, squareFootage, stories, settings)
                    return (
                      <div key={service.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={service.name} id={`wc-service-${service.id}`} />
                        <label
                          htmlFor={`wc-service-${service.id}`}
                          className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {service.display_name ||
                            service.name.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          {priceForOption !== null && (
                            <span className="ml-2 text-muted-foreground font-normal">
                              (${priceForOption.toFixed(2)})
                            </span>
                          )}
                        </label>
                      </div>
                    )
                  })}
                </RadioGroup>
              </div>

              {windowAddonOptions.length > 0 && (
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="window-addons">
                    <AccordionTrigger>Window Cleaning Add-ons</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-2">
                        {windowAddonOptions.map((addon) => (
                          <div key={addon.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`window-addon-${addon.id}`}
                              checked={windowAddons.includes(addon.name)}
                              onCheckedChange={(checked) => handleWindowAddonChange(addon.name, checked === true)}
                            />
                            <label
                              htmlFor={`window-addon-${addon.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {addon.display_name ||
                                addon.name.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                              {addon.flat_fee && (
                                <span className="ml-1 text-muted-foreground">(${addon.flat_fee.toFixed(2)})</span>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              {additionalWindowServiceOptions.length > 0 && (
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="additional-window-services">
                    <AccordionTrigger>Additional Window Cleaning Services</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-2">
                        {additionalWindowServiceOptions.map((service) => (
                          <div key={service.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`additional-window-${service.id}`}
                              checked={additionalWindowServices[service.name] || false}
                              onCheckedChange={(checked) =>
                                handleAdditionalWindowServiceChange(service.name, checked === true)
                              }
                            />
                            <label
                              htmlFor={`additional-window-${service.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {service.display_name ||
                                service.name.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                              {service.flat_fee && (
                                <span className="ml-1 text-muted-foreground">(${service.flat_fee.toFixed(2)})</span>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skylights"
                  checked={hasSkylights}
                  onCheckedChange={(checked) => setHasSkylights(checked === true)}
                />
                <label
                  htmlFor="skylights"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Do you have skylights?
                  {settings?.skylight_flat_fee && (
                    <span className="ml-1 text-muted-foreground">(${settings.skylight_flat_fee.toFixed(2)})</span>
                  )}
                </label>
              </div>
              {finalPrice !== null && (
                <div className="border-t pt-4 mt-4 flex items-center justify-between text-xl font-bold">
                  <span className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" /> Estimated Price:
                  </span>
                  <span>{finalPrice !== null ? `$${finalPrice.toFixed(2)}` : "N/A"}</span>
                </div>
              )}
            </CardContent>
          </>
        )
      case "pressure-washing-details":
        console.log("Rendering Pressure Washing Details step.") // Debug log
        console.log("showPressureWashing:", showPressureWashing) // Debug log
        console.log("Customer Type:", customerType) // Debug log
        console.log("Residential PW Options:", residentialPressureWashingOptions) // Debug log
        console.log("Commercial PW Options:", commercialPressureWashingOptions) // Debug log

        return (
          <>
            <CardHeader>
              <CardTitle>Exterior Cleaning (Pressure Washing)</CardTitle>
              <CardDescription>Select the exterior cleaning services you are interested in.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                {customerType === "residential" && residentialPressureWashingOptions.length > 0 && (
                  <>
                    {residentialPressureWashingOptions.map((service) => (
                      <div key={service.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`pw-service-${service.id}`}
                          checked={selectedPressureWashingServices.includes(service.name)}
                          onCheckedChange={(checked) =>
                            handlePressureWashingServiceChange(service.name, checked === true)
                          }
                        />
                        <label
                          htmlFor={`pw-service-${service.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {service.display_name ||
                            service.name.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          {(service.per_sqft_price || service.flat_fee) && (
                            <span className="ml-1 text-muted-foreground">
                              ({service.per_sqft_price && `$${service.per_sqft_price.toFixed(2)}/sq ft`}
                              {service.per_sqft_price && service.flat_fee && " + "}
                              {service.flat_fee && `$${service.flat_fee.toFixed(2)} flat`}
                              {service.minimum_price && ` min $${service.minimum_price.toFixed(2)}`})
                            </span>
                          )}
                        </label>
                      </div>
                    ))}
                  </>
                )}
                {customerType === "commercial" && commercialPressureWashingOptions.length > 0 && (
                  <>
                    {commercialPressureWashingOptions.map((service) => (
                      <div key={service.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`commercial-pw-service-${service.id}`}
                          checked={selectedPressureWashingServices.includes(service.name)}
                          onCheckedChange={(checked) =>
                            handlePressureWashingServiceChange(service.name, checked === true)
                          }
                        />
                        <label
                          htmlFor={`commercial-pw-service-${service.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {service.display_name ||
                            service.name.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </label>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground mt-2">
                      Commercial exterior cleaning services require a custom quote.
                    </p>
                  </>
                )}
                {/* Display message if no options are available for the current customer type */}
                {customerType === "residential" && residentialPressureWashingOptions.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No residential exterior cleaning services available. Please configure them in your dashboard
                    settings.
                  </p>
                )}
                {customerType === "commercial" && commercialPressureWashingOptions.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No commercial exterior cleaning services available. Please configure them in your dashboard
                    settings.
                  </p>
                )}
              </div>
              {finalPrice !== null && (
                <div className="border-t pt-4 mt-4 flex items-center justify-between text-xl font-bold">
                  <span className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" /> Estimated Price:
                  </span>
                  <span>{finalPrice !== null ? `$${finalPrice.toFixed(2)}` : "N/A"}</span>
                </div>
              )}
            </CardContent>
          </>
        )
      case "quote-review":
        return (
          <>
            <CardHeader>
              <CardTitle>Your Instant Quote</CardTitle>
              <CardDescription>Review your details and confirm your quote.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" /> Address:
                  </span>
                  <span>{address}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium flex items-center">
                    <Home className="h-4 w-4 mr-2 text-muted-foreground" /> Stories:
                  </span>
                  <span>{stories}</span>
                </div>
                {showWindowCleaning && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-medium flex items-center">
                        <Wrench className="h-4 w-4 mr-2 text-muted-foreground" /> Window Service Type:
                      </span>
                      <span>
                        {windowServiceOptions.find((s) => s.name === windowServiceType)?.display_name ||
                          windowServiceType.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </div>
                    {windowAddons.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium flex items-center">
                          <Info className="h-4 w-4 mr-2 text-muted-foreground" /> Window Add-ons:
                        </span>
                        <span>
                          {windowAddons
                            .map(
                              (a) =>
                                windowAddonOptions.find((s) => s.name === a)?.display_name ||
                                a.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                            )
                            .join(", ")}
                        </span>
                      </div>
                    )}
                    {Object.keys(additionalWindowServices).filter((key) => additionalWindowServices[key]).length >
                      0 && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium flex items-center">
                          <Info className="h-4 w-4 mr-2 text-muted-foreground" /> Additional Window Services:
                        </span>
                        <span>
                          {Object.keys(additionalWindowServices)
                            .filter((key) => additionalWindowServices[key])
                            .map(
                              (a) =>
                                additionalWindowServiceOptions.find((s) => s.name === a)?.display_name ||
                                a.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                            )
                            .join(", ")}
                        </span>
                      </div>
                    )}
                    {hasSkylights && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium flex items-center">
                          <Info className="h-4 w-4 mr-2 text-muted-foreground" /> Skylights:
                        </span>
                        <span>Yes</span>
                      </div>
                    )}
                  </>
                )}
                {showPressureWashing && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-medium mb-2">Exterior Cleaning Details</h3>
                    {selectedPressureWashingServices.length > 0 ? (
                      <div className="flex items-center justify-between">
                        <span className="font-medium flex items-center">
                          <Wrench className="h-4 w-4 mr-2 text-muted-foreground" /> Services:
                        </span>
                        <span>
                          {selectedPressureWashingServices
                            .map(
                              (s) =>
                                services.find((svc) => svc.name === s)?.display_name ||
                                s.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                            )
                            .join(", ")}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No exterior cleaning services selected.</p>
                    )}
                  </div>
                )}
                {notes && (
                  <div className="flex items-start justify-between">
                    <span className="font-medium flex items-center">
                      <Info className="h-4 w-4 mr-2 text-muted-foreground" /> Notes:
                    </span>
                    <span className="text-right max-w-[70%]">{notes}</span>
                  </div>
                )}
                <div className="border-t pt-4 mt-4 flex items-center justify-between text-2xl font-bold">
                  <span className="flex items-center">
                    <DollarSign className="h-6 w-6 mr-2" /> Estimated Price:
                  </span>
                  <span>{finalPrice !== null ? `$${finalPrice.toFixed(2)}` : "N/A"}</span>
                </div>
              </div>
            </CardContent>
          </>
        )
      default:
        return null
    }
  }

  if (isLoading && services.length === 0) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading calculator...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`w-full mx-auto ${currentStep === "quote-review" ? "max-w-2xl" : "max-w-md"}`}>
      {renderStepContent()}
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        {currentStep === "quote-review" ? (
          !quoteSubmitted ? (
            <Button onClick={handleSubmitQuote} disabled={isSubmittingQuote}>
              {isSubmittingQuote ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm & Get Quote"}
            </Button>
          ) : (
            <Button disabled>
              <CheckCircle className="mr-2 h-4 w-4" /> Quote Submitted!
            </Button>
          )
        ) : (
          <Button onClick={handleNext} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Next"}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
