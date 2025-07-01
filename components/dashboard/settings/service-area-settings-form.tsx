"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, MapPin, MessageSquare, Settings } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

type ServiceSettings = {
  service_radius_miles: number
  outside_area_message: string
}

export function ServiceAreaSettingsForm() {
  const [serviceSettings, setServiceSettings] = useState<ServiceSettings>({
    service_radius_miles: 20,
    outside_area_message:
      "We're sorry, but your location is outside our typical service area. Please provide your contact information below and we'll call you to see if we can make an exception for your location.",
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [tempMessage, setTempMessage] = useState("")
  const [tempRadius, setTempRadius] = useState(20)
  const [savingSettings, setSavingSettings] = useState(false)

  // Load service settings
  const loadSettings = async () => {
    try {
      setLoading(true)
      const settingsResponse = await fetch("/api/settings?" + new Date().getTime(), {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (settingsResponse.ok) {
        const settingsResult = await settingsResponse.json()
        if (settingsResult.success && settingsResult.data) {
          setServiceSettings({
            service_radius_miles: settingsResult.data.service_radius_miles || 20,
            outside_area_message:
              settingsResult.data.outside_area_message ||
              "We're sorry, but your location is outside our typical service area. Please provide your contact information below and we'll call you to see if we can make an exception for your location.",
          })
          setTempRadius(settingsResult.data.service_radius_miles || 20)
          setTempMessage(
            settingsResult.data.outside_area_message ||
              "We're sorry, but your location is outside our typical service area. Please provide your contact information below and we'll call you to see if we can make an exception for your location.",
          )
        }
      }
    } catch (error) {
      console.error("Failed to load service area settings:", error)
      setError("Failed to load service area settings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  // Notify calculator of service changes
  const notifyServiceUpdate = () => {
    // Notify other windows/tabs about service updates
    if (typeof window !== "undefined") {
      window.postMessage({ type: "SERVICES_UPDATED" }, "*")
      // Also try to notify parent window if embedded
      if (window.parent !== window) {
        window.parent.postMessage({ type: "SERVICES_UPDATED" }, "*")
      }
    }
  }

  // Save service settings
  const saveServiceSettings = async () => {
    setSavingSettings(true)
    try {
      const response = await fetch("/api/settings/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_radius_miles: tempRadius,
          outside_area_message: tempMessage,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save settings")
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || "Failed to save settings")
      }

      // Update local state
      setServiceSettings({
        service_radius_miles: tempRadius,
        outside_area_message: tempMessage,
      })

      // Notify calculator of changes
      notifyServiceUpdate()

      toast({
        title: "Settings Updated",
        description: "Service area settings have been updated successfully.",
      })

      setShowMessageDialog(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSavingSettings(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Service Area Settings
        </CardTitle>
        <CardDescription>Configure your service radius and outside area messaging.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="serviceRadius" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Service Radius (miles)
            </Label>
            <Input
              id="serviceRadius"
              type="number"
              min="1"
              max="100"
              value={tempRadius}
              onChange={(e) => setTempRadius(Number.parseInt(e.target.value) || 20)}
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">
              Maximum distance from your business location for standard service
            </p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Outside Area Message
            </Label>
            <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Edit Outside Area Message
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Outside Service Area Message</DialogTitle>
                  <DialogDescription>
                    This message is shown to customers when their location is outside your service radius.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="outsideMessage">Message Text</Label>
                    <Textarea
                      id="outsideMessage"
                      value={tempMessage}
                      onChange={(e) => setTempMessage(e.target.value)}
                      placeholder="Enter the message to show customers outside your service area..."
                      className="min-h-[120px]"
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Preview:</h4>
                    <p className="text-sm text-blue-800">{tempMessage}</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveServiceSettings} disabled={savingSettings}>
                    {savingSettings ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <p className="text-xs text-muted-foreground">
              Current radius: {serviceSettings.service_radius_miles} miles
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <Button onClick={saveServiceSettings} disabled={savingSettings}>
            {savingSettings ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Service Area Settings"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
