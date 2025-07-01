"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { useQuery } from "@tanstack/react-query"
import type { Quote } from "@/types/supabase"
import { DataTable } from "@/components/ui/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Loader2 } from "lucide-react"

interface SentFollowUpEmailsTableProps {
  initialData?: Quote[]
}

export function SentFollowUpEmailsTable({ initialData }: SentFollowUpEmailsTableProps) {
  console.log("SentFollowUpEmailsTable rendering. Initial data:", initialData)

  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["sentFollowUpEmails", pagination.pageIndex, pagination.pageSize],
    queryFn: async () => {
      console.log(
        `Fetching data for sentFollowUpEmails queryKey: page=${pagination.pageIndex + 1}, pageSize=${pagination.pageSize}`,
      )
      const response = await fetch(
        `/api/quotes/followup-sent?page=${pagination.pageIndex + 1}&pageSize=${pagination.pageSize}`,
      )
      if (!response.ok) {
        const errorBody = await response.json()
        console.error("API response not OK:", errorBody)
        throw new Error(errorBody.message || "Failed to fetch sent follow-up emails")
      }
      const result = await response.json()
      console.log("API response data:", result)
      return result
    },
    initialData: initialData ? { data: initialData, pagination: { total: initialData.length } } : undefined,
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new
  })

  console.log("useQuery state: isLoading:", isLoading, "isError:", isError, "error:", error, "data:", data)

  const columns: ColumnDef<Quote>[] = [
    {
      accessorKey: "customer_name",
      header: "Customer Name",
      cell: ({ row }) => row.original.customer_name || "N/A",
    },
    {
      accessorKey: "customer_email",
      header: "Email",
      cell: ({ row }) => row.original.customer_email || "N/A",
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => row.original.address || "N/A",
    },
    {
      accessorKey: "final_price",
      header: "Quote Price",
      cell: ({ row }) => (row.original.final_price ? `$${row.original.final_price.toFixed(2)}` : "N/A"),
    },
    {
      accessorKey: "followup_sent_at",
      header: "Sent At",
      cell: ({ row }) =>
        row.original.followup_sent_at ? format(new Date(row.original.followup_sent_at), "MMM dd, yyyy HH:mm") : "N/A",
    },
  ]

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sent Follow-Up Emails</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading sent emails...</span>
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sent Follow-Up Emails</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Error loading sent follow-up emails: {error?.message || "Unknown error"}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sent Follow-Up Emails</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={data?.data || []}
          pagination={pagination}
          setPagination={setPagination}
          pageCount={data?.pagination?.totalPages || 0}
          totalCount={data?.pagination?.total || 0}
        />
      </CardContent>
    </Card>
  )
}
