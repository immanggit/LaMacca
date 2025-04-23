import type React from "react"
import { Montserrat } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { createClient } from "@/utils/supabase/server"

import "./globals.css"

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
})

export const metadata = {
  title: "KidsEnglish - Fun Learning Platform",
  description: "Interactive English learning platform for children",
    generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let session = null

  try {
    const supabase = createClient()
    const { data } = await supabase.auth.getSession()
    session = data.session
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error)
    // Continue rendering without session
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${montserrat.variable} font-sans overflow-x-hidden`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
