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
      invoices: {
        Row: {
          id: string
          organization_id: string
          client_id: string
          number: string
          status: Database['public']['Enums']['invoice_status']
          issued_at: string
          due_at: string
          paid_at: string | null
          currency: string
          subtotal_cents: number
          vat_cents: number
          total_cents: number
          notes: string | null
          pdf_path: string | null
          sent_at: string | null
          reminder_count: number
          last_reminder_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          client_id: string
          number: string
          status?: Database['public']['Enums']['invoice_status']
          issued_at?: string
          due_at: string
          paid_at?: string | null
          currency?: string
          subtotal_cents?: number
          vat_cents?: number
          total_cents?: number
          notes?: string | null
          pdf_path?: string | null
          sent_at?: string | null
          reminder_count?: number
          last_reminder_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>
        Relationships: []
      }
      invoice_line_items: {
        Row: {
          id: string
          invoice_id: string
          position: number
          description: string
          quantity: number
          unit: string | null
          unit_price_cents: number
          vat_rate: number
          amount_cents: number
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          position: number
          description: string
          quantity?: number
          unit?: string | null
          unit_price_cents: number
          vat_rate?: number
          amount_cents: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['invoice_line_items']['Insert']>
        Relationships: []
      }
      invoice_events: {
        Row: {
          id: string
          invoice_id: string
          organization_id: string
          type: Database['public']['Enums']['invoice_event_type']
          actor_user_id: string | null
          payload: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          organization_id: string
          type: Database['public']['Enums']['invoice_event_type']
          actor_user_id?: string | null
          payload?: Record<string, unknown> | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['invoice_events']['Insert']>
        Relationships: []
      }
      invoice_number_sequences: {
        Row: { organization_id: string; year: number; last_value: number }
        Insert: { organization_id: string; year: number; last_value?: number }
        Update: Partial<Database['public']['Tables']['invoice_number_sequences']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      create_organization: {
        Args: { p_name: string; p_org_number?: string | null; p_vat_number?: string | null }
        Returns: Database['public']['Tables']['organizations']['Row']
      }
      next_invoice_number: {
        Args: { p_org: string }
        Returns: string
      }
      create_invoice: {
        Args: {
          p_org: string
          p_client_id: string
          p_due_at: string
          p_currency?: string
          p_notes?: string | null
          p_line_items?: unknown
          p_issued_at?: string | null
        }
        Returns: Database['public']['Tables']['invoices']['Row']
      }
    }
    Enums: {
      invoice_status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
      invoice_event_type:
        | 'created'
        | 'sent'
        | 'viewed'
        | 'reminder_sent'
        | 'marked_paid'
        | 'cancelled'
        | 'note_added'
    }
    CompositeTypes: Record<string, never>
  }
}
