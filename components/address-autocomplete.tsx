"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import type { AddressDetails } from "@/app/types" // Ensure AddressDetails type is imported

interface AddressAutocompleteProps {
  initialAddress: string
  onAddressSelect: (address: string, details: AddressDetails | null) => void
  placeholder?: string
  required?: boolean
}

export function AddressAutocomplete({
  initialAddress,
  onAddressSelect,
  placeholder = "Start typing your address...",
  required = false,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [inputValue, setInputValue] = useState(initialAddress)

  // Load Google Maps API script
  useEffect(() => {
    if (window.google?.maps?.places) {
      setIsScriptLoaded(true)
      return
    }

    setIsLoading(true)
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAPgad6Y-v0_gOf6IbTplAIniz34cUSHc0&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => {
      setIsScriptLoaded(true)
      setIsLoading(false)
    }
    script.onerror = () => {
      console.error("Error loading Google Maps API")
      setIsLoading(false)
    }
    document.head.appendChild(script)

    return () => {
      // Clean up script if component unmounts before script loads
      if (!isScriptLoaded) {
        document.head.removeChild(script)
      }
    }
  }, [isScriptLoaded]) // Depend on isScriptLoaded to prevent re-adding script

  // Initialize autocomplete when script is loaded and input is available
  useEffect(() => {
    if (isScriptLoaded && inputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: "us" },
        fields: ["address_components", "formatted_address", "geometry", "name"],
        types: ["address"],
      })

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace()
        if (place.formatted_address && place.geometry?.location) {
          const details: AddressDetails = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            formatted_address: place.formatted_address,
            // You can add more details from place object if needed
            // e.g., street_number, route, locality, administrative_area_level_1, postal_code, country
          }
          setInputValue(place.formatted_address) // Update internal input value
          onAddressSelect(place.formatted_address, details)
        } else {
          // If no valid place is selected (e.g., user types and doesn't select from dropdown)
          onAddressSelect(inputValue, null)
        }
      })
    }
  }, [isScriptLoaded, onAddressSelect, inputValue]) // Add inputValue to dependencies

  // Keep internal state in sync with initialAddress prop
  useEffect(() => {
    setInputValue(initialAddress)
  }, [initialAddress])

  return (
    <div className="space-y-2">
      <Label htmlFor="address">Property Address *</Label> {/* Label moved here */}
      <div className="relative">
        <Input
          id="address"
          ref={inputRef}
          placeholder={placeholder}
          value={inputValue} // Use internal state
          onChange={(e) => {
            setInputValue(e.target.value)
            onAddressSelect(e.target.value, null) // Clear details if user types manually
          }}
          required={required}
          className="pr-10"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Start typing and select your address from the dropdown for accurate quotes
      </p>
    </div>
  )
}
