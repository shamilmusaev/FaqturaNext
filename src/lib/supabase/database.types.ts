export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          org_number: string | null
          vat_number: string | null
          address: Record<string, unknown> | null
          iban: string | null
          bankgiro: string | null
          plusgiro: string | null
          swish_number: string | null
          default_vat_rate: number
          default_payment_terms_days: number
          locale: string
          currency: string
          invoice_number_template: string
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          org_number?: string | null
          vat_number?: string | null
          address?: Record<string, unknown> | null
          iban?: string | null
          bankgiro?: string | null
          plusgiro?: string | null
          swish_number?: string | null
          default_vat_rate?: number
          default_payment_terms_days?: number
          locale?: string
          currency?: string
          invoice_number_template?: string
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>
        Relationships: []
      }
      memberships: {
        Row: {
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          created_at: string
        }
        Insert: {
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['memberships']['Insert']>
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          organization_id: string
          name: string
          email: string | null
          org_number: string | null
          vat_number: string | null
          address: { street?: string; postal?: string; city?: string; country?: string } | null
          notes: string | null
          archived_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          email?: string | null
          org_number?: string | null
          vat_number?: string | null
          address?: { street?: string; postal?: string; city?: string; country?: string } | null
          notes?: string | null
          archived_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'clients_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      create_organization: {
        Args: { p_name: string; p_org_number?: string | null; p_vat_number?: string | null }
        Returns: Database['public']['Tables']['organizations']['Row']
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
