import type { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { fontSans, fontMono } from '@/styles/fonts'
import { Toaster } from '@/components/ui/toast'
import './globals.css'

export const metadata = { title: 'Faqtura', description: 'Swedish invoicing, calm and direct.' }

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()
  return (
    <html lang={locale} className={`${fontSans.variable} ${fontMono.variable}`}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Toaster />
      </body>
    </html>
  )
}
