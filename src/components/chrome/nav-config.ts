import type { Route } from 'next'

export type NavKey =
  | 'overview'
  | 'invoices'
  | 'clients'
  | 'time'
  | 'expenses'
  | 'reports'
  | 'settings'

export type NavItem = {
  href: Route
  key: NavKey
  // Pathname prefix used for the active state. Defaults to `href`. Set for
  // /settings, which links straight to /settings/account (to skip the server
  // redirect) but should stay active across every /settings/* route.
  match?: string
}

// Single source of truth for the primary app navigation order.
export const APP_NAV: NavItem[] = [
  { href: '/overview' as Route, key: 'overview' },
  { href: '/invoices' as Route, key: 'invoices' },
  { href: '/clients' as Route, key: 'clients' },
  { href: '/time' as Route, key: 'time' },
  { href: '/expenses' as Route, key: 'expenses' },
  { href: '/reports' as Route, key: 'reports' },
  { href: '/settings/account' as Route, key: 'settings', match: '/settings' },
]

// Tabs surfaced in the mobile bottom bar (a subset of APP_NAV).
export const MOBILE_NAV_KEYS: ReadonlySet<NavKey> = new Set<NavKey>([
  'overview',
  'invoices',
  'clients',
  'time',
  'settings',
])

export const SETTINGS_NAV = [
  { href: '/settings/account' as Route, key: 'account' as const },
  { href: '/settings/company' as Route, key: 'company' as const },
  { href: '/settings/payment' as Route, key: 'payment' as const },
  { href: '/settings/invoicing' as Route, key: 'invoicing' as const },
  { href: '/settings/localization' as Route, key: 'localization' as const },
]

// Boundary-correct active check: '/settings' matches '/settings/account' but
// NOT '/settings-custom'; '/time' matches '/time/projects' but not '/timesheet'.
export function isNavActive(pathname: string, href: string, match?: string): boolean {
  const base = match ?? href
  return pathname === base || pathname.startsWith(`${base}/`)
}
