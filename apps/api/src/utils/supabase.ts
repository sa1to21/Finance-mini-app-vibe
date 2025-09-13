import { createClient, SupabaseClient, User } from '@supabase/supabase-js'

// Database types based on our schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          telegram_id: number
          username: string | null
          first_name: string | null
          last_name: string | null
          language_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          telegram_id: number
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          language_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          telegram_id?: number
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          language_code?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          balance: number
          currency: 'RUB' | 'USD' | 'EUR' | 'BTC' | 'ETH'
          type: 'cash' | 'card' | 'bank' | 'crypto' | 'investment'
          icon: string
          color: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          balance?: number
          currency?: 'RUB' | 'USD' | 'EUR' | 'BTC' | 'ETH'
          type?: 'cash' | 'card' | 'bank' | 'crypto' | 'investment'
          icon?: string
          color?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          balance?: number
          currency?: 'RUB' | 'USD' | 'EUR' | 'BTC' | 'ETH'
          type?: 'cash' | 'card' | 'bank' | 'crypto' | 'investment'
          icon?: string
          color?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string | null
          name: string
          type: 'income' | 'expense'
          icon: string
          color: string
          is_default: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          type: 'income' | 'expense'
          icon?: string
          color?: string
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          type?: 'income' | 'expense'
          icon?: string
          color?: string
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string
          category_id: string
          amount: number
          type: 'income' | 'expense'
          description: string | null
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          category_id: string
          amount: number
          type: 'income' | 'expense'
          description?: string | null
          date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          category_id?: string
          amount?: number
          type?: 'income' | 'expense'
          description?: string | null
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
      transfers: {
        Row: {
          id: string
          user_id: string
          from_account_id: string
          to_account_id: string
          amount: number
          description: string | null
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          from_account_id: string
          to_account_id: string
          amount: number
          description?: string | null
          date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          from_account_id?: string
          to_account_id?: string
          amount?: number
          description?: string | null
          date?: string
          created_at?: string
        }
      }
    }
    Functions: {
      create_user_profile: {
        Args: {
          telegram_id_param: number
          username_param?: string
          first_name_param?: string
          last_name_param?: string
        }
        Returns: string
      }
      get_total_balance: {
        Args: {
          user_uuid: string
        }
        Returns: number
      }
    }
  }
}

let supabase: SupabaseClient<Database>
let supabaseAdmin: SupabaseClient<Database>

export function initSupabase(config: {
  url: string
  anonKey: string
  serviceRoleKey: string
}) {
  // Regular client for user operations
  supabase = createClient<Database>(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false
    }
  })

  // Admin client for server-side operations
  supabaseAdmin = createClient<Database>(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return { supabase, supabaseAdmin }
}

export function getSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error('Supabase not initialized. Call initSupabase() first.')
  }
  return supabase
}

export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!supabaseAdmin) {
    throw new Error('Supabase Admin not initialized. Call initSupabase() first.')
  }
  return supabaseAdmin
}

// Helper function to get user from JWT token
export async function getUserFromToken(token: string): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error) throw error
    return user
  } catch (error) {
    console.error('Error getting user from token:', error)
    return null
  }
}

// Helper function to create Supabase client with user JWT
export function getSupabaseWithAuth(accessToken: string): SupabaseClient<Database> {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      },
      auth: {
        persistSession: false
      }
    }
  )
}