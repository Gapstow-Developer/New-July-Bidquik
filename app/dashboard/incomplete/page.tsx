import { unstable_noStore } from "next/cache"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"

export const metadata = {
  title: "Incomplete Quotes",
}

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

async function getIncompleteForms() {
  const supabase = createServerComponentClient({ cookies })

  try {
    unstable_noStore() // Force no caching
    const timestamp = Date.now()
    const { data, error: fetchError } = await supabase
      .from("quotes")
      .select("*")
      .eq("status", "incomplete")
      .order("updated_at", { ascending: false })

    if (fetchError) {
      console.error("Supabase fetch error:", fetchError)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching incomplete forms:", error)
    return []
  }
}

export default async function IncompleteFormsPage() {
  unstable_noStore() // Force no caching
  const incompleteForms = await getIncompleteForms()

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-4">Incomplete Quotes</h1>
      <DataTable columns={columns} data={incompleteForms} />
    </div>
  )
}
