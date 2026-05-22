import type { ReactNode } from 'react'

export const metadata = { title: 'Faqtura', description: 'Swedish invoicing, calm and direct.' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
