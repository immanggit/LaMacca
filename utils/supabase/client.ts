import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "Supabase URL and Anon Key are required! Please check your environment variables:" +
        "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined.",
    )
    // Return a dummy client that will fail gracefully
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.reject(new Error("Supabase client not properly initialized")),
        signUp: () => Promise.reject(new Error("Supabase client not properly initialized")),
        signOut: () => Promise.resolve({ error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: new Error("Supabase client not properly initialized") }),
          }),
        }),
      }),
    } as any
  }

  try {
    return createBrowserClient(supabaseUrl, supabaseKey)
  } catch (error) {
    console.error("Error creating Supabase browser client:", error)
    // Return a dummy client that will fail gracefully
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.reject(new Error("Supabase client not properly initialized")),
        signUp: () => Promise.reject(new Error("Supabase client not properly initialized")),
        signOut: () => Promise.resolve({ error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: new Error("Supabase client not properly initialized") }),
          }),
        }),
      }),
    } as any
  }
}
