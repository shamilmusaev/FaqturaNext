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
          bank_name: string | null
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
          bank_name?: string | null
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
          number: string | null
          status: Database['public']['Enums']['invoice_status']
          issued_at: string
          due_at: string
          delivery_date: string | null
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
          template: string
          ocr_reference: string | null
          hide_ocr: boolean
          reverse_vat: boolean
          rot_rut_type: string | null
          rot_rut_cents: number
          our_reference: string | null
          their_reference: string | null
          order_number: string | null
          payment_terms_days: number | null
        }
        Insert: {
          id?: string
          organization_id: string
          client_id: string
          number?: string | null
          status?: Database['public']['Enums']['invoice_status']
          issued_at?: string
          due_at: string
          delivery_date?: string | null
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
          template?: string
          ocr_reference?: string | null
          hide_ocr?: boolean
          reverse_vat?: boolean
          rot_rut_type?: string | null
          rot_rut_cents?: number
          our_reference?: string | null
          their_reference?: string | null
          order_number?: string | null
          payment_terms_days?: number | null
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
          discount_percent: number
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
          discount_percent?: number
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
      invoice_versions: {
        Row: {
          id: string
          invoice_id: string
          organization_id: string
          version_number: number
          created_at: string
          created_by: string | null
          snapshot: Record<string, unknown>
          snapshot_hash: string
        }
        Insert: {
          id?: string
          invoice_id: string
          organization_id: string
          version_number: number
          created_at?: string
          created_by?: string | null
          snapshot: Record<string, unknown>
          snapshot_hash: string
        }
        Update: Partial<Database['public']['Tables']['invoice_versions']['Insert']>
        Relationships: []
      }
      projects: {
        Row: {
          client_id: string
          created_at: string
          estimate_minutes: number | null
          id: string
          name: string
          organization_id: string
          rate_cents: number | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          estimate_minutes?: number | null
          id?: string
          name: string
          organization_id: string
          rate_cents?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          estimate_minutes?: number | null
          id?: string
          name?: string
          organization_id?: string
          rate_cents?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          actual_minutes: number | null
          created_at: string
          est_max_minutes: number | null
          est_min_minutes: number | null
          id: string
          name: string
          organization_id: string
          position: number
          project_id: string
          status: string
          updated_at: string
        }
        Insert: {
          actual_minutes?: number | null
          created_at?: string
          est_max_minutes?: number | null
          est_min_minutes?: number | null
          id?: string
          name: string
          organization_id: string
          position?: number
          project_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          actual_minutes?: number | null
          created_at?: string
          est_max_minutes?: number | null
          est_min_minutes?: number | null
          id?: string
          name?: string
          organization_id?: string
          position?: number
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          entry_date: string
          id: string
          minutes: number
          organization_id: string
          project_id: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          entry_date: string
          id?: string
          minutes: number
          organization_id: string
          project_id: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          entry_date?: string
          id?: string
          minutes?: number
          organization_id?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
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
          p_delivery_date?: string | null
          p_hide_ocr?: boolean
          p_template?: string
          p_reverse_vat?: boolean
          p_rot_rut_type?: string | null
          p_rot_rut_cents?: number
          p_our_reference?: string | null
          p_their_reference?: string | null
          p_order_number?: string | null
          p_payment_terms_days?: number | null
          p_number?: string | null
        }
        Returns: Database['public']['Tables']['invoices']['Row']
      }
      update_invoice: {
        Args: {
          p_invoice_id: string
          p_client_id: string
          p_due_at: string
          p_currency?: string
          p_notes?: string | null
          p_line_items?: unknown
          p_issued_at?: string | null
          p_template?: string
          p_reverse_vat?: boolean
          p_rot_rut_type?: string | null
          p_rot_rut_cents?: number
          p_our_reference?: string | null
          p_their_reference?: string | null
          p_order_number?: string | null
          p_payment_terms_days?: number | null
          p_number?: string | null
          p_delivery_date?: string | null
          p_hide_ocr?: boolean
        }
        Returns: Database['public']['Tables']['invoices']['Row']
      }
      send_invoice: {
        Args: { p_invoice_id: string }
        Returns: Database['public']['Tables']['invoices']['Row']
      }
      update_organization: {
        Args: {
          p_org_id: string
          p_name?: string | null
          p_org_number?: string | null
          p_vat_number?: string | null
          p_address?: Record<string, unknown> | null
          p_iban?: string | null
          p_bankgiro?: string | null
          p_plusgiro?: string | null
          p_swish_number?: string | null
          p_default_vat_rate?: number | null
          p_default_payment_terms_days?: number | null
          p_locale?: string | null
          p_currency?: string | null
          p_invoice_number_template?: string | null
          p_logo_url?: string | null
          p_bank_name?: string | null
        }
        Returns: Database['public']['Tables']['organizations']['Row']
      }
      save_invoice_version: {
        Args: { p_invoice_id: string }
        Returns: Database['public']['Tables']['invoice_versions']['Row'] | null
      }
      create_invoice_from_version: {
        Args: { p_version_id: string; p_org: string }
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
