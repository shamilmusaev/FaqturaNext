import type { DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import { BoldBlueTemplate, BoldGreenTemplate, BoldRedTemplate } from './bold'
import { ClassicTemplate } from './classic'
import type { TemplateId } from './ids'
import { MinimalTemplate } from './minimal'
import { ModernTemplate } from './modern'
import { ProfessionalTemplate } from './professional'
import type { InvoiceTemplateProps } from './types'

export { DEFAULT_TEMPLATE_ID, TEMPLATE_IDS, isTemplateId } from './ids'
export type { InvoicePdfData, TemplateId, InvoiceTemplateProps } from './types'

// Function components returning a react-pdf <Document>. Typed as a plain
// function (not ComponentType) so callers can invoke `Component({ invoice })`
// directly and hand the element to renderToBuffer / usePDF.
export interface TemplateMeta {
  id: TemplateId
  /** Display name used as fallback when no i18n key is present. */
  name: string
  description: string
  Component: (props: InvoiceTemplateProps) => ReactElement<DocumentProps>
}

export const INVOICE_TEMPLATES: TemplateMeta[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean sheet with an orange brand accent',
    Component: ModernTemplate,
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Strict, neutral Swedish invoice with ruled boxes',
    Component: ClassicTemplate,
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Teal header band with an info strip — ported from the legacy design',
    Component: ProfessionalTemplate,
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, airy invoice with a beige sender box and accent totals',
    Component: MinimalTemplate,
  },
  {
    id: 'bold-red',
    name: 'Bold Red',
    description: 'Dark header, filled red items table and a colour foot bar',
    Component: BoldRedTemplate,
  },
  {
    id: 'bold-blue',
    name: 'Bold Blue',
    description: 'Navy header, light table with row icons and a colour foot bar',
    Component: BoldBlueTemplate,
  },
  {
    id: 'bold-green',
    name: 'Bold Green',
    description: 'Dark-green header, light table with row icons and a colour foot bar',
    Component: BoldGreenTemplate,
  },
]

/** Resolve a template by id, falling back to the default when unknown. */
export function getTemplate(id: string | null | undefined): TemplateMeta {
  return INVOICE_TEMPLATES.find((t) => t.id === id) ?? (INVOICE_TEMPLATES[0] as TemplateMeta)
}
