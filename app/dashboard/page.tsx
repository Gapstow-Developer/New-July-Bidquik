import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Overview } from "@/components/dashboard/overview"
import { RecentQuotes } from "@/components/dashboard/recent-quotes"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { ComprehensiveAnalytics } from "@/components/dashboard/comprehensive-analytics"
import { QuotesManagement } from "@/components/dashboard/quotes-management"
import { FollowUpCenter } from "@/components/dashboard/followup-center"
import { createServerSupabaseClient } from "@/lib/supabase"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export const metadata: Metadata = {
  title: "Dashboard - Window Cleaning Calculator",
  description: "Comprehensive dashboard for your window cleaning business",
}

// Force dynamic rendering
export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()

  // Get session with extensive error handling
  let session = null
  let firstName = "there"

  try {
    session = await getServerSession(authOptions)
    if (session && typeof session === "object" && session.user && typeof session.user === "object") {
      const userName = session.user.name
      if (typeof userName === "string" && userName.length > 0) {
        const nameParts = userName.split(" ")
        if (nameParts.length > 0 && nameParts[0].length > 0) {
          firstName = nameParts[0]
        }
      }
    }
  } catch (error) {
    console.error("Error getting session:", error)
  }

  // Get all quotes data for the dashboard
  const { data: allQuotes } = await supabase.from("quotes").select("*").order("created_at", { ascending: false })

  const { data: recentQuotes } = await supabase
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  const { data: submittedQuotes } = await supabase
    .from("quotes")
    .select("*")
    .eq("status", "submitted")
    .order("created_at", { ascending: false })

  const { data: incompleteQuotes } = await supabase
    .from("quotes")
    .select("*")
    .eq("status", "incomplete")
    .order("created_at", { ascending: false })

  // Get quotes needing follow-up
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { data: followUpNeeded } = await supabase
    .from("quotes")
    .select("*")
    .eq("status", "incomplete")
    .lt("created_at", tenMinutesAgo)
    .is("followup_sent_at", null)
    .not("customer_email", "is", null)
    .not("customer_name", "is", null)

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Hey {firstName}, here's your business overview!</h2>
      </div>

      {/* Key Metrics */}
      <DashboardStats />

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quotes">All Quotes</TabsTrigger>
          <TabsTrigger value="incomplete">Incomplete</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="followup">Follow-ups</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Quote Submissions Over Time</CardTitle>
                <CardDescription>Track your business growth and seasonal trends</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest quote submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentQuotes quotes={recentQuotes || []} />
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {allQuotes && allQuotes.length > 0
                    ? Math.round(((submittedQuotes?.length || 0) / allQuotes.length) * 100)
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  {submittedQuotes?.length || 0} of {allQuotes?.length || 0} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Quote Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  $
                  {submittedQuotes && submittedQuotes.length > 0
                    ? Math.round(
                        submittedQuotes.reduce((sum, q) => sum + (q.final_price || 0), 0) / submittedQuotes.length,
                      )
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground">Average per completed quote</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Follow-ups Needed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{followUpNeeded?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Incomplete quotes ready for follow-up</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {allQuotes?.filter((q) => {
                    const quoteDate = new Date(q.created_at)
                    const now = new Date()
                    return quoteDate.getMonth() === now.getMonth() && quoteDate.getFullYear() === now.getFullYear()
                  }).length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Total quotes this month</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* All Quotes Tab */}
        <TabsContent value="quotes" className="space-y-4">
          <QuotesManagement quotes={submittedQuotes || []} />
        </TabsContent>

        {/* Incomplete Quotes Tab */}
        <TabsContent value="incomplete" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Incomplete Quotes ({incompleteQuotes?.length || 0})</CardTitle>
              <CardDescription>Potential customers who started but didn't complete their quote</CardDescription>
            </CardHeader>
            <CardContent>
              <QuotesManagement quotes={incompleteQuotes || []} showIncomplete={true} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <ComprehensiveAnalytics quotes={allQuotes || []} />
        </TabsContent>

        {/* Follow-up Tab */}
        <TabsContent value="followup" className="space-y-4">
          <FollowUpCenter followUpNeeded={followUpNeeded || []} allIncomplete={incompleteQuotes || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
