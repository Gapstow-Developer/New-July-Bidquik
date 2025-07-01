"use client"

import type React from "react"

import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { QuoteEditDialog } from "@/components/dashboard/quote-edit-dialog" // Import QuoteEditDialog
import type { Database } from "@/types/supabase" // Import Database type

type Quote = Database["public"]["Tables"]["quotes"]["Row"] // Use Supabase type for full details

interface IncompleteFormsTableProps {
  data: Quote[] // Use Quote type
  deleteQuote: (id: string) => Promise<void>
}

export const IncompleteFormsTable: React.FC<IncompleteFormsTableProps> = ({ data, deleteQuote }) => {
  const [search, setSearch] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false) // State for dialog
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null) // State for selected quote
  const router = useRouter()

  const refreshData = () => {
    router.refresh()
    // window.location.reload() // No longer needed with router.refresh()
  }

  const handleViewEditQuote = (quote: Quote) => {
    setSelectedQuote(quote)
    setIsEditDialogOpen(true)
  }

  const columns: ColumnDef<Quote>[] = [
    // Use Quote type
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "created_at", // Changed to created_at to match DB
      header: "Created At",
      cell: ({ row }) => {
        try {
          const date = new Date(row.getValue("created_at"))
          return date.toLocaleString() // Format date for display
        } catch {
          return "Invalid date"
        }
      },
    },
    {
      accessorKey: "customer_name", // Changed to customer_name
      header: "Customer Name",
    },
    {
      accessorKey: "customer_email", // Changed to customer_email
      header: "Customer Email",
    },
    {
      accessorKey: "customer_phone", // Changed to customer_phone
      header: "Customer Phone",
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const quote = row.original

        return (
          <div className="flex items-center space-x-2">
            <Button size="sm" onClick={() => handleViewEditQuote(quote)}>
              {" "}
              {/* Changed to open dialog */}
              View
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the quote from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      await handleDeleteQuote(quote.id)
                    }}
                  >
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const filteredRows = data?.filter((row) => {
    return Object.keys(row).some((key) => {
      const value = (row as any)[key] // Cast to any to access dynamically
      if (typeof value === "string") {
        return value.toLowerCase().includes(search.toLowerCase())
      }
      return false
    })
  })

  useEffect(() => {
    // No need to setRowModel here, getCoreRowModel handles it
  }, [filteredRows, table])

  const handleDeleteQuote = async (id: string) => {
    try {
      await deleteQuote(id)
      toast.success("Quote deleted successfully")
      refreshData() // Use refreshData
    } catch (error: any) {
      toast.error(error?.message || "Something went wrong")
    }
  }

  return (
    <div>
      <div className="flex items-center py-4">
        <Input type="search" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button variant="outline" onClick={refreshData} className="ml-2">
          Refresh Data
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {filteredRows?.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))}
            {filteredRows?.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedQuote && (
        <QuoteEditDialog
          quote={selectedQuote}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onQuoteUpdated={refreshData} // Refresh data after update
        />
      )}
    </div>
  )
}
