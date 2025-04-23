import type React from "react"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import StickyHeader from "@/components/dashboard/sticky-header"
import MobileNav from "@/components/mobile-nav"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  // Get the session first
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If no session, redirect to login
  if (!session) {
    redirect("/login")
  }

  // Get the user from the session
  const user = session.user

  // If we somehow have a session but no user, redirect to login
  if (!user) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <StickyHeader />
      <div className="flex-1 pt-16">
        <div>
          <main className="w-full px-4 md:px-6">{children}</main>
        </div>
      </div>
      <MobileNav />
    </div>
  )
}
