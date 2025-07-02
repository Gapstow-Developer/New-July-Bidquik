"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser, useClerk } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export default function OnboardingPage() {
  const { user } = useUser()
  const { setActive } = useClerk()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [organizationName, setOrganizationName] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)

    try {
      // Create organization in Clerk
      const org = await user.createOrganization({
        name: organizationName,
      })

      // Set the new organization as active
      if (setActive) {
        await setActive({ organization: org.id })
      }

      // Initialize organization settings in our database
      await fetch("/api/organizations/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: org.id,
          organizationName: org.name,
          businessEmail: user.primaryEmailAddress?.emailAddress,
        }),
      })

      toast({
        title: "Organization created successfully!",
        description: "Welcome to your new workspace.",
      })

      router.push("/dashboard")
    } catch (error: any) {
      console.error("Error creating organization:", error)
      toast({
        title: "Error creating organization",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Create Your Organization</CardTitle>
          <CardDescription className="text-lg">Let's set up your workspace to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization Name *</Label>
              <Input
                id="organizationName"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="e.g., Crystal Clear Windows"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !organizationName}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Organization & Continue"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
