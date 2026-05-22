import type { ReactNode } from 'react'
import { fontSans, fontMono } from '@/styles/fonts'
import { Toaster } from '@/components/ui/toast'
import './globals.css'

export const metadata = { title: 'Faqtura', description: 'Swedish invoicing, calm and direct.' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fontSans.variable} ${fontMono.variable}`}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
