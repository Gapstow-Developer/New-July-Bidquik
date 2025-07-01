"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ImageOff, MapPin } from "lucide-react"

interface PropertyStreetViewProps {
  latitude: number | null
  longitude: number | null
  address: string
}

const GOOGLE_MAPS_API_KEY = "AIzaSyAPgad6Y-v0_gOf6IbTplAIniz34cUSHc0" // Use your actual API key

export function PropertyStreetView({ latitude, longitude, address }: PropertyStreetViewProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (latitude && longitude) {
      setLoading(true)
      setError(null)
      const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${latitude},${longitude}&fov=90&heading=235&pitch=10&key=${GOOGLE_MAPS_API_KEY}`

      // We can't directly check for 404 with a simple <img> tag,
      // so we'll try to load it and handle the error if it doesn't appear.
      // A more robust solution would involve a server-side check or the JS API.
      const img = new Image()
      img.src = streetViewUrl
      img.onload = () => {
        setImageUrl(streetViewUrl)
        setLoading(false)
      }
      img.onerror = () => {
        setError("Street View image not available for this location.")
        setLoading(false)
      }
    } else {
      setImageUrl(null)
      setLoading(false)
      setError("Address coordinates not available for Street View.")
    }
  }, [latitude, longitude, address])

  const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5" /> Property View
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center p-4">
        {loading ? (
          <div className="flex h-48 w-full items-center justify-center rounded-md bg-gray-800">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="flex h-48 w-full flex-col items-center justify-center rounded-md bg-gray-800 text-gray-400">
            <ImageOff className="h-12 w-12" />
            <p className="mt-2 text-center text-sm">{error}</p>
            <a
              href={googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-blue-400 hover:underline text-xs"
            >
              View on Google Maps
            </a>
          </div>
        ) : (
          <>
            <img
              src={imageUrl || "/placeholder.svg?height=300&width=600&query=Street%20view%20of%20property"}
              alt={`Street view of ${address}`}
              className="h-48 w-full rounded-md object-cover"
            />
            <a
              href={googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-blue-400 hover:underline text-sm"
            >
              View on Google Maps
            </a>
          </>
        )}
      </CardContent>
    </Card>
  )
}
