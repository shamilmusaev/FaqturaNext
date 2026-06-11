// Lightweight template identity, free of any @react-pdf imports. Schema, forms
// and server actions depend on this so they never pull the heavy renderer into
// their bundles; only the preview/registry imports the actual components.

export const TEMPLATE_IDS = [
  'modern',
  'classic',
  'professional',
  'bold-red',
  'bold-blue',
  'bold-green',
] as const

export type TemplateId = (typeof TEMPLATE_IDS)[number]

export const DEFAULT_TEMPLATE_ID: TemplateId = 'modern'

export function isTemplateId(id: string): id is TemplateId {
  return (TEMPLATE_IDS as readonly string[]).includes(id)
}
