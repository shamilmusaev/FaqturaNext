import 'server-only'

type Language = 'sv' | 'en'

const languageName: Record<Language, string> = {
  sv: 'Swedish',
  en: 'English',
}

/** A past line item the user invoiced before, used as a rate reference. */
export type RateReference = {
  description: string
  unitPrice: number // kronor
  unit: string | null
  vatRate: number
}

/**
 * System prompt for Magic Fill: turn messy, multi-language work notes into
 * clean invoice line items. The output schema is enforced separately by
 * streamObject; this prompt governs content and judgement calls.
 *
 * `rates` are the user's usual prices mined from past invoices; the model
 * reuses a price when a generated line clearly matches one of them.
 */
export function magicFillSystemPrompt(
  language: Language,
  currency: string,
  rates: RateReference[] = [],
): string {
  const lang = languageName[language]
  const rateBlock =
    rates.length > 0
      ? [
          '',
          `The user's usual rates from previous invoices (description → price per unit in ${currency}):`,
          ...rates.map(
            (r) =>
              `- ${r.description} → ${r.unitPrice}${r.unit ? `/${r.unit}` : ''} (VAT ${r.vatRate}%)`,
          ),
          'When a line you produce clearly refers to the same work as one of these, reuse that exact unitPrice (and its unit and vatRate). Otherwise keep unitPrice 0. Never copy a price for unrelated work.',
        ].join('\n')
      : ''
  return [
    `You convert a craftsperson's or consultant's rough work notes into professional invoice line items.`,
    `The notes may be messy and mix Swedish, English and Russian. Always write the resulting "description" in ${lang}, in clear professional invoicing language.`,
    'The notes are often a time log spanning several days. Date headers (e.g. "8 June", "9/6") are NOT line items — use them only to understand the entries.',
    'Rules:',
    '- Consolidate: merge every entry that describes the same task or service into ONE line item, and sum their quantities. Do not output the same task twice. For example three "Meeting" entries become a single line, and repeated work on the same project is one line with the combined hours.',
    `- "unit": use "h" for time/hours, "st" for countable items/pieces, and "" when neither clearly applies.`,
    `- "quantity": the total amount for that consolidated task. Convert any time to hours (50 min = 0.83, 1 h 30 min = 1.5) before summing, and round the total to at most 2 decimals. Default to 1 when a task is mentioned without an amount.`,
    `- "unitPrice": the price per unit as a number in ${currency} (kronor, not öre). Never invent a price — use 0 when the notes give none.`,
    `- "vatRate": one of 0, 6, 12, 25. Use 25 unless the notes clearly indicate another Swedish VAT rate.`,
    `- "discountPercent": 0 unless a discount is explicitly stated.`,
    '- Do not add commentary, totals or VAT lines — only the consolidated line items themselves.',
    rateBlock,
  ].join('\n')
}

/**
 * System prompt for the text-polish action. `line` rewrites a single invoice
 * line description; `notes` rewrites the free-text invoice notes block.
 */
export function polishSystemPrompt(context: 'line' | 'notes', language: Language): string {
  const lang = languageName[language]
  const shared = `You rewrite text on an invoice so it reads clearly and professionally in ${lang}. Preserve the original meaning, names, numbers and amounts. Return only the rewritten text — no quotes, no markdown, no explanation.`
  if (context === 'line') {
    return `${shared} This is a single invoice line item description: keep it to one concise line.`
  }
  return `${shared} This is the invoice notes / message to the customer: keep a polite professional tone and a similar length.`
}

/**
 * System prompt for polishing every line description at once, so the whole
 * invoice reads in one consistent voice.
 */
export function polishAllSystemPrompt(language: Language): string {
  const lang = languageName[language]
  return [
    `You rewrite a list of invoice line item descriptions so they read clearly and professionally in ${lang}.`,
    'Unify capitalization and terminology across the whole list so the invoice reads in one consistent voice.',
    "Preserve each item's meaning, names, numbers and amounts. Keep each to one concise line.",
    'Return exactly the same number of items, in the same order. Do not merge, split, add or drop items. No quotes, no markdown.',
  ].join(' ')
}
